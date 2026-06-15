import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { sellerOrdersWhere } from "@/lib/seller-orders";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["accept", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["seller"]);
  if (!auth.ok) return auth.response;
  const sellerId = auth.session.user.id;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const order = await prisma.order.findFirst({
    where: { id: params.id, ...sellerOrdersWhere(sellerId) },
    include: { items: { where: { sellerId } } },
  });
  if (!order) return jsonError("Order not found", [], 404);

  const status = parsed.data.action === "accept" ? "accepted" : "rejected";
  const deliveryStatus = parsed.data.action === "accept" ? "order_confirmed" : "cancelled";

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.updateMany({
      where: { orderId: order.id, sellerId },
      data: {
        sellerOrderStatus: status,
        deliveryStatus: parsed.data.action === "accept" ? "order_confirmed" : "cancelled",
      },
    });

    if (parsed.data.action === "accept") {
      const hasAccepted = order.orderStatus === "accepted" || order.orderStatus === "processing";
      if (!hasAccepted) {
        await tx.order.update({
          where: { id: order.id },
          data: { orderStatus: "accepted" },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "accepted",
            comment: "Store accepted order",
            createdBy: sellerId,
          },
        });
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "order_confirmed",
          comment: "Seller confirmed items",
          createdBy: sellerId,
        },
      });
    } else {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          comment: parsed.data.reason || "Store rejected order",
          createdBy: sellerId,
        },
      });
    }
  });

  if (order.customerId) {
    const accepted = parsed.data.action === "accept";
    await alertCustomer({
      customerId: order.customerId,
      orderId: order.id,
      title: accepted ? "Order accepted" : "Order update",
      message: accepted
        ? `A store accepted items on order ${order.code}.`
        : `A store could not fulfill items on order ${order.code}.`,
      smsBody: formatOrderSms(
        order.code,
        accepted ? "Your order was accepted by the store." : "A store could not fulfill part of your order.",
      ),
      type: accepted ? "success" : "warning",
      link: `/dashboard/orders/${order.id}`,
    });
  }

  return jsonSuccess({ action: parsed.data.action, sellerOrderStatus: status, deliveryStatus });
}
