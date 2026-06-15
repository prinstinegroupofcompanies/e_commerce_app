import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(6).max(200),
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid request", parsed.error.flatten().fieldErrors, 422);

    const tokenHash = hashToken(parsed.data.token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) return jsonError("Invalid or expired reset link", [], 400);
    if (record.usedAt) return jsonError("This reset link has already been used", [], 400);
    if (record.expiresAt < new Date()) return jsonError("This reset link has expired", [], 400);

    const hash = await bcrypt.hash(parsed.data.password, 10);

    if (record.userType === "customer") {
      await prisma.$transaction([
        prisma.customer.update({ where: { id: record.userId }, data: { password: hash } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        prisma.passwordResetToken.deleteMany({
          where: { userType: "customer", userId: record.userId, usedAt: null, NOT: { id: record.id } },
        }),
      ]);
    } else {
      return jsonError("Unsupported account type", [], 400);
    }

    return jsonSuccess({ reset: true });
  } catch (e) {
    console.error(e);
    return jsonError("Could not reset password", [], 500);
  }
}
