import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  phone: z.string().max(50).optional().nullable(),
  hours: z.string().max(200).optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const created = await prisma.pickupPoint.create({ data: parsed.data });
  return jsonSuccess(created, {}, 201);
}
