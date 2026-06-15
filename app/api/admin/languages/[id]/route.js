import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.language.updateMany({ data: { isDefault: false } });
    return tx.language.update({ where: { id }, data: parsed.data });
  });
  return jsonSuccess(updated);
}

export async function DELETE(_request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  await prisma.language.delete({ where: { id } });
  return jsonSuccess({ deleted: true });
}
