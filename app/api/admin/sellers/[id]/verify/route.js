import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const seller = await prisma.seller.findUnique({ where: { id: params.id } });
  if (!seller) return jsonError("Seller not found", [], 404);

  const { action, rejectionReason } = parsed.data;
  const data =
    action === "approve"
      ? {
          verificationStatus: "approved",
          verifiedAt: new Date(),
          isShopActive: true,
          rejectionReason: null,
        }
      : {
          verificationStatus: "rejected",
          verifiedAt: null,
          isShopActive: false,
          rejectionReason: rejectionReason?.trim() || "Application rejected",
        };

  const updated = await prisma.seller.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      shopName: true,
      verificationStatus: true,
      verifiedAt: true,
      isShopActive: true,
    },
  });

  await logActivity({
    adminId: auth.session.user.id,
    action: `seller_${action}`,
    subject: seller.shopName || seller.email,
    meta: { sellerId: seller.id },
  });

  if (action === "approve") {
    await prisma.notification.create({
      data: {
        sellerId: seller.id,
        title: "Store approved",
        message: "Your Markay Hall store is now active. You can list products and receive orders.",
        type: "success",
        link: "/seller/dashboard",
      },
    });
  }

  return jsonSuccess(updated);
}
