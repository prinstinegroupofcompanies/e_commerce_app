import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  isActive: z.boolean().optional(),
  isSandbox: z.boolean().optional(),
  displayName: z.string().max(200).optional(),
});

export async function PATCH(request, context) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;
    const { id } = context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    const updated = await prisma.paymentMethod.update({ where: { id }, data: parsed.data });
    return jsonSuccess(updated);
  } catch (e) {
    if (e?.code === "P2025") return jsonError("Not found", [], 404);
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
