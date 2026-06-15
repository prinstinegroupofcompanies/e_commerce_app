import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Provide a valid email", parsed.error.flatten().fieldErrors, 422);

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true } });
      }
      return jsonSuccess({ subscribed: true, alreadySubscribed: true });
    }

    await prisma.newsletterSubscriber.create({ data: { email: parsed.data.email, isActive: true } });
    return jsonSuccess({ subscribed: true });
  } catch (e) {
    console.error(e);
    return jsonError("Could not subscribe", [], 500);
  }
}
