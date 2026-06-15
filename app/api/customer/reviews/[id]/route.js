import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function DELETE(_request, context) {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  const review = await prisma.review.findUnique({ where: { id }, select: { customerId: true } });
  if (!review || review.customerId !== gate.session.user.id) return jsonError("Not found", [], 404);
  await prisma.review.delete({ where: { id } });
  return jsonSuccess({ deleted: true });
}
