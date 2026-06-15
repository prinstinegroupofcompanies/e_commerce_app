import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(6).max(50).optional(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  currentLat: z.number().optional().nullable(),
  currentLng: z.number().optional().nullable(),
});

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["delivery"]);
  if (!auth.ok) return auth.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const existing = await prisma.deliveryRider.findFirst({
    where: { id: params.id, companyId: auth.session.user.id },
  });
  if (!existing) return jsonError("Rider not found", [], 404);

  const data = { ...parsed.data };
  if (data.currentLat != null && data.currentLng != null) {
    data.lastLocationAt = new Date();
  }

  const rider = await prisma.deliveryRider.update({
    where: { id: params.id },
    data,
  });
  return jsonSuccess(rider);
}
