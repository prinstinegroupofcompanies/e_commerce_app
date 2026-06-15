import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { sellerOrderItemPatchSchema } from "@/lib/validators/seller-order";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(request, context) {
  const session = await auth();
  if (session?.user?.role !== "seller") {
    return jsonError("Unauthorized", [], 401);
  }
  const sellerId = session.user.id;
  const { itemId } = context.params;
  if (!itemId) return jsonError("Missing item id", [], 400);

  const body = await request.json();
  const parsed = sellerOrderItemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const { deliveryStatus, trackingId, sellerOrderStatus } = parsed.data;
  const nextTracking = trackingId === undefined ? undefined : trackingId?.trim() || null;

  const line = await prisma.orderItem.findFirst({
    where: { id: itemId, sellerId },
    include: {
      order: { select: { id: true, code: true, orderStatus: true, customerId: true } },
    },
  });
  if (!line) return jsonError("Line item not found", [], 404);
  if (line.order.orderStatus === "cancelled") {
    return jsonError("Cannot update fulfillment on a cancelled order", [], 400);
  }

  const data = {};
  if (deliveryStatus !== undefined && deliveryStatus !== line.deliveryStatus) {
    data.deliveryStatus = deliveryStatus;
  }
  if (sellerOrderStatus !== undefined && sellerOrderStatus !== line.sellerOrderStatus) {
    data.sellerOrderStatus = sellerOrderStatus;
  }
  if (nextTracking !== undefined) {
    const prev = line.trackingId || null;
    if (nextTracking !== prev) data.trackingId = nextTracking;
  }

  if (Object.keys(data).length === 0) {
    return jsonSuccess({
      id: line.id,
      deliveryStatus: line.deliveryStatus,
      trackingId: line.trackingId,
    });
  }

  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data,
    select: { id: true, deliveryStatus: true, trackingId: true, name: true },
  });

  if (line.order.customerId) {
    const parts = [];
    if (data.deliveryStatus) parts.push(`status: ${data.deliveryStatus}`);
    if (data.trackingId !== undefined) {
      parts.push(data.trackingId ? `tracking: ${data.trackingId}` : "tracking cleared");
    }
    await notify({
      customerId: line.order.customerId,
      title: `Shipment update — ${line.order.code}`,
      message: `${updated.name}: ${parts.join(" · ") || "updated"}`,
      type: "info",
      link: `/dashboard/orders/${line.order.id}`,
    });
  }

  return jsonSuccess(updated);
}
