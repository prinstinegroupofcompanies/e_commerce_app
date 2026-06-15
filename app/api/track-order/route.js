import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { TRACKING_LABELS } from "@/lib/marketplace-statuses";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(3).max(80).transform((s) => s.trim().toUpperCase()),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Provide order code and email", parsed.error.flatten().fieldErrors, 422);

    const order = await prisma.order.findFirst({
      where: {
        code: parsed.data.code,
        OR: [
          { guestEmail: parsed.data.email },
          { customer: { email: parsed.data.email } },
        ],
      },
      include: {
        items: { select: { id: true, name: true, quantity: true, deliveryStatus: true, trackingId: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        pickupPoint: {
          select: { name: true, address: true, city: true, country: true, phone: true, hours: true },
        },
        deliveryCompany: { select: { name: true, logo: true } },
        deliveryAssignments: {
          include: {
            rider: { select: { name: true, phone: true, currentLat: true, currentLng: true, lastLocationAt: true } },
          },
        },
      },
    });
    if (!order) return jsonError("No order found with that code and email", [], 404);

    let shippingAddress;
    try {
      shippingAddress = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddress = {};
    }

    return jsonSuccess({
      code: order.code,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      placedAt: order.createdAt,
      trackingId: order.trackingId,
      isPickup: order.isPickup,
      pickupPoint: order.pickupPoint,
      shippingAddress,
      items: order.items,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        label: TRACKING_LABELS[h.status] || h.status,
        comment: h.comment,
        createdAt: h.createdAt,
      })),
      deliveryCompany: order.deliveryCompany,
      deliveryAssignments: order.deliveryAssignments.map((a) => ({
        status: a.status,
        riderLat: a.riderLat,
        riderLng: a.riderLng,
        etaMinutes: a.etaMinutes,
        rider: a.rider,
        pickedUpAt: a.pickedUpAt,
        deliveredAt: a.deliveredAt,
      })),
      deliveryConfirmed: Boolean(order.deliveryOtpVerifiedAt),
      county: order.county,
      landmark: order.landmark,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not look up order", [], 500);
  }
}
