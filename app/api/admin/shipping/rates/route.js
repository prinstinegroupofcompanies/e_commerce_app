import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(1).max(200),
  rateType: z.enum(["flat", "weight", "price"]).default("flat"),
  cost: z.coerce.number().nonnegative(),
  estimatedDays: z.string().max(50).optional().nullable(),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const zone = await prisma.shippingZone.findUnique({ where: { id: parsed.data.zoneId } });
  if (!zone) return jsonError("Zone not found", [], 404);

  const created = await prisma.shippingRate.create({
    data: {
      zoneId: parsed.data.zoneId,
      name: parsed.data.name,
      rateType: parsed.data.rateType,
      cost: parsed.data.cost,
      estimatedDays: parsed.data.estimatedDays ?? null,
    },
  });
  return jsonSuccess(created, {}, 201);
}
