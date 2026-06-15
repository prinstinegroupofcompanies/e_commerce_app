import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional().nullable(),
  hours: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const updated = await prisma.pickupPoint.update({ where: { id }, data: parsed.data });
  return jsonSuccess(updated);
}

export async function DELETE(_request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  await prisma.pickupPoint.delete({ where: { id } });
  return jsonSuccess({ deleted: true });
}
