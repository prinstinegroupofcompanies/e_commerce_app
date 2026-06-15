import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  profileId: z.string().min(1),
  country: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  rate: z.coerce.number().nonnegative(),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const profile = await prisma.taxProfile.findUnique({ where: { id: parsed.data.profileId } });
  if (!profile) return jsonError("Profile not found", [], 404);
  const created = await prisma.taxRate.create({
    data: {
      profileId: parsed.data.profileId,
      country: parsed.data.country?.trim() || null,
      state: parsed.data.state?.trim() || null,
      rate: parsed.data.rate,
    },
  });
  return jsonSuccess(created, {}, 201);
}
