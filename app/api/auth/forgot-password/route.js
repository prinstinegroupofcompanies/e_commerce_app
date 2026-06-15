import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { sendTemplateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  userType: z.enum(["customer", "seller"]).default("customer"),
});

const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonSuccess({ sent: true });
    }

    const { email, userType } = parsed.data;

    let account = null;
    if (userType === "seller") {
      account = await prisma.seller.findUnique({ where: { email } });
    } else {
      account = await prisma.customer.findUnique({ where: { email } });
    }

    if (account && account.password) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userType,
          userId: account.id,
          expiresAt,
        },
      });

      const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetPath = userType === "seller" ? "/seller/reset-password" : "/reset-password";
      const resetUrl = `${base}${resetPath}?token=${rawToken}`;

      try {
        await sendTemplateEmail({
          to: email,
          subject: `Reset your password`,
          template: "password-reset.hbs",
          data: { resetUrl, siteName: process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall" },
        });
      } catch (err) {
        console.error("[forgot-password] email", err);
      }
    }

    // Always respond success to avoid email enumeration.
    return jsonSuccess({ sent: true });
  } catch (e) {
    console.error(e);
    return jsonSuccess({ sent: true });
  }
}
