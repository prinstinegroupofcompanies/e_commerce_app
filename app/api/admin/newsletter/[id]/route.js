import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const { id } = params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", parsed.error.flatten().fieldErrors, 422);

  const updated = await prisma.newsletterSubscriber.update({
    where: { id },
    data: parsed.data,
  });
  return jsonSuccess({ subscriber: updated });
}

export async function DELETE(_request, { params }) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const { id } = params;
  await prisma.newsletterSubscriber.delete({ where: { id } });
  return jsonSuccess({ deleted: true });
}
