import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { registerCustomerSchema } from "@/lib/validators/user";
import { isEmailVerificationRequired, sendVerificationEmail } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = registerCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { name, email, password } = parsed.data;

    const exists = await prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return jsonError("Email already registered", [], 409);
    }

    const hash = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: { name, email, password: hash },
      select: { id: true, email: true, name: true },
    });

    if (isEmailVerificationRequired()) {
      await sendVerificationEmail({
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      });
    } else {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    return jsonSuccess({
      registered: true,
      verifyEmail: isEmailVerificationRequired(),
    });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
