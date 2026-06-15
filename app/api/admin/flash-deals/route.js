import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1).max(200),
  banner: z.string().max(2000).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  if (parsed.data.endsAt <= parsed.data.startsAt) {
    return jsonError("End date must be after start date", [], 422);
  }
  const created = await prisma.flashDeal.create({ data: parsed.data });
  return jsonSuccess(created, {}, 201);
}
