import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid email", parsed.error.flatten().fieldErrors, 422);

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    if (!existing.isActive) {
      await prisma.newsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    return jsonSuccess({ subscriber: existing });
  }

  const created = await prisma.newsletterSubscriber.create({ data: { email: parsed.data.email, isActive: true } });
  return jsonSuccess({ subscriber: created });
}
