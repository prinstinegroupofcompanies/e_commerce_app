import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { sellerOrdersWhere } from "@/lib/seller-orders";
import { sendTemplateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Store hands order to the delivery company selected at checkout */
export async function POST(request, { params }) {
  const auth = await requireSessionRoles(["seller"]);
  if (!auth.ok) return auth.response;
  const sellerId = auth.session.user.id;

  const order = await prisma.order.findFirst({
    where: { id: params.id, ...sellerOrdersWhere(sellerId) },
    include: {
      items: { where: { sellerId } },
      deliveryCompany: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return jsonError("Order not found", [], 404);
  if (!order.deliveryCompanyId) {
    return jsonError("No delivery company on this order", [], 400);
  }

  const pendingItems = order.items.filter(
    (i) => i.sellerOrderStatus === "accepted" || i.sellerOrderStatus === "preparing" || i.sellerOrderStatus === "ready_for_delivery",
  );
  if (pendingItems.length === 0) {
    return jsonError("Accept the order and prepare items before handover", [], 400);
  }

  let shippingAddress = {};
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {
    shippingAddress = {};
  }

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { shopName: true, shopAddress: true, shopCity: true },
  });
  const pickupAddress = [seller?.shopName, seller?.shopAddress, seller?.shopCity].filter(Boolean).join(", ");
  const deliveryAddress = [
    shippingAddress.address,
    shippingAddress.landmark,
    shippingAddress.city,
    shippingAddress.county || order.county,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join(", ");

  const assignment = await prisma.$transaction(async (tx) => {
    let existing = await tx.deliveryAssignment.findFirst({
      where: { orderId: order.id, sellerId },
    });
    if (!existing) {
      existing = await tx.deliveryAssignment.create({
        data: {
          orderId: order.id,
          sellerId,
          deliveryCompanyId: order.deliveryCompanyId,
          deliverySpeed: order.deliverySpeed || "standard",
          deliveryFee: order.deliveryFee,
          pickupAddress,
          deliveryAddress,
          status: "pending_accept",
          handoverAt: new Date(),
        },
      });
    } else {
      existing = await tx.deliveryAssignment.update({
        where: { id: existing.id },
        data: {
          status: "pending_accept",
          handoverAt: new Date(),
          pickupAddress,
          deliveryAddress,
        },
      });
    }

    const firstItem = pendingItems[0];
    await tx.orderItem.updateMany({
      where: { orderId: order.id, sellerId },
      data: {
        sellerOrderStatus: "ready_for_delivery",
        deliveryStatus: "waiting_pickup",
        deliveryAssignmentId: existing.id,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { orderStatus: "processing" },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "waiting_pickup",
        comment: "Handed over to delivery company",
        createdBy: sellerId,
      },
    });

    return existing;
  });

  if (order.deliveryCompany?.email) {
    try {
      await sendTemplateEmail({
        to: order.deliveryCompany.email,
        subject: `Pickup request — ${order.code}`,
        template: "order-status-update.hbs",
        data: {
          orderCode: order.code,
          status: "waiting_pickup",
          message: `Pickup: ${pickupAddress}. Deliver to: ${deliveryAddress}`,
        },
      });
    } catch (e) {
      console.error("[handover] delivery email", e);
    }
  }

  return jsonSuccess({ assignmentId: assignment.id, status: assignment.status });
}
