import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const company = await prisma.deliveryCompany.findUnique({ where: { id: params.id } });
  if (!company) return jsonError("Delivery company not found", [], 404);

  const data =
    parsed.data.action === "approve"
      ? { verificationStatus: "approved", verifiedAt: new Date() }
      : { verificationStatus: "rejected", verifiedAt: null, isActive: false };

  const updated = await prisma.deliveryCompany.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, verificationStatus: true, verifiedAt: true },
  });

  await logActivity({
    adminId: auth.session.user.id,
    action: `delivery_${parsed.data.action}`,
    subject: company.name,
    meta: { companyId: company.id },
  });

  return jsonSuccess(updated);
}
