import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { notifyMany } from "@/lib/notify";

export const dynamic = "force-dynamic";

const CANCELLABLE_STATUSES = new Set(["pending", "accepted"]);

export async function POST(_request, context) {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  try {
    const { id } = context.params;
    const order = await prisma.order.findFirst({
      where: { id, customerId: gate.session.user.id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            sellerId: true,
            name: true,
          },
        },
      },
    });
    if (!order) return jsonError("Order not found", [], 404);

    if (!CANCELLABLE_STATUSES.has(order.orderStatus)) {
      return jsonError("This order can no longer be cancelled", [], 400);
    }

    if (order.paymentStatus === "paid") {
      return jsonError("Paid orders must be cancelled by support; request a refund instead", [], 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "cancelled",
          paymentStatus: order.paymentStatus === "pending" ? "cancelled" : order.paymentStatus,
        },
      });

      for (const line of order.items) {
        if (line.variantId) {
          await tx.productVariant.update({
            where: { id: line.variantId },
            data: { stock: { increment: line.quantity } },
          });
        } else if (line.productId) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { increment: line.quantity } },
          });
        }
        if (line.id) {
          await tx.orderItem.update({
            where: { id: line.id },
            data: { deliveryStatus: "cancelled" },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "cancelled",
          comment: "Cancelled by customer",
          createdBy: gate.session.user.email || gate.session.user.id,
        },
      });
    });

    const sellerIds = [...new Set(order.items.map((l) => l.sellerId).filter(Boolean))];
    if (sellerIds.length > 0) {
      await notifyMany({
        sellerIds,
        title: `Order ${order.code} cancelled`,
        message: `Customer cancelled the order before fulfillment.`,
        type: "warning",
        link: `/seller/orders/${order.id}`,
      });
    }

    return jsonSuccess({ cancelled: true });
  } catch (e) {
    console.error(e);
    return jsonError("Could not cancel order", [], 500);
  }
}
