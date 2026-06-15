import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendTemplateEmail } from "@/lib/email";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isEmailVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

/**
 * @param {{ customerId: string; email: string; name: string }} opts
 */
export async function sendVerificationEmail({ customerId, email, name }) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { customerId } });
  await prisma.emailVerificationToken.create({
    data: { tokenHash, customerId, expiresAt },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${base}/api/auth/verify-email?token=${rawToken}`;

  try {
    await sendTemplateEmail({
      to: email,
      subject: "Verify your email",
      template: "verify-email.hbs",
      data: { name, verifyUrl },
    });
  } catch (err) {
    console.error("[email-verification] send", err);
  }

  return { sent: true };
}

/**
 * @param {string} rawToken
 */
export async function verifyEmailToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, reason: "invalid" };
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: row.customerId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, customerId: row.customerId };
}
