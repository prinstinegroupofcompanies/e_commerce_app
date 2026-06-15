import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { TRACKING_LABELS } from "@/lib/marketplace-statuses";

export const dynamic = "force-dynamic";

/** Lightweight poll for live delivery map on order detail */
export async function GET(request, { params }) {
  const auth = await requireSessionRoles(["customer"]);
  if (!auth.ok) return auth.response;

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: auth.session.user.id },
    select: {
      id: true,
      code: true,
      orderStatus: true,
      paymentStatus: true,
      deliveryOtpVerifiedAt: true,
      deliveryAssignments: {
        include: {
          rider: {
            select: {
              name: true,
              phone: true,
              currentLat: true,
              currentLng: true,
              lastLocationAt: true,
            },
          },
        },
      },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!order) return jsonError("Not found", [], 404);

  return jsonSuccess({
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryConfirmed: Boolean(order.deliveryOtpVerifiedAt),
    assignments: order.deliveryAssignments.map((a) => ({
      id: a.id,
      status: a.status,
      riderLat: a.riderLat ?? a.rider?.currentLat,
      riderLng: a.riderLng ?? a.rider?.currentLng,
      etaMinutes: a.etaMinutes,
      rider: a.rider,
    })),
    timeline: order.statusHistory.map((h) => ({
      status: h.status,
      label: TRACKING_LABELS[h.status] || h.status,
      comment: h.comment,
      createdAt: h.createdAt,
    })),
  });
}
