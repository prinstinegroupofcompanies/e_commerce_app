import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonSuccess({ sent: true });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, emailVerifiedAt: true, password: true },
    });

    if (customer?.password && !customer.emailVerifiedAt) {
      await sendVerificationEmail({
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      });
    }

    return jsonSuccess({ sent: true });
  } catch (e) {
    console.error(e);
    return jsonSuccess({ sent: true });
  }
}
