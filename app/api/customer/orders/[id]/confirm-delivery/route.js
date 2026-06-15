import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { settleSellerEarningsForOrder } from "@/lib/seller-settlement";
import { notifyMany } from "@/lib/notify";
import { sendTemplateEmail } from "@/lib/email";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  otp: z.string().length(6),
});

export async function POST(request, { params }) {
  const auth = await requireSessionRoles(["customer"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid delivery code", [], 422);

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: auth.session.user.id },
    include: { items: true },
  });
  if (!order) return jsonError("Order not found", [], 404);
  if (order.deliveryOtpVerifiedAt) return jsonError("Delivery already confirmed", [], 400);
  if (!order.deliveryOtp || order.deliveryOtp !== parsed.data.otp) {
    return jsonError("Incorrect delivery PIN", [], 403);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        deliveryOtpVerifiedAt: new Date(),
        orderStatus: "delivered",
      },
    });
    await tx.orderItem.updateMany({
      where: { orderId: order.id },
      data: { deliveryStatus: "delivered", sellerOrderStatus: "ready_for_delivery" },
    });
    await tx.deliveryAssignment.updateMany({
      where: { orderId: order.id, status: { notIn: ["delivered", "cancelled", "rejected"] } },
      data: { status: "delivered", deliveredAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "delivered",
        comment: "Customer confirmed delivery with PIN",
        createdBy: auth.session.user.id,
      },
    });
  });

  try {
    await settleSellerEarningsForOrder(order.id);
  } catch (e) {
    console.error("[confirm-delivery] settlement", e);
  }

  const sellerIds = [...new Set(order.items.map((i) => i.sellerId).filter(Boolean))];
  if (sellerIds.length) {
    await notifyMany({
      sellerIds,
      title: "Delivery completed",
      message: `Order ${order.code} was confirmed delivered. Earnings are being settled.`,
      type: "success",
      link: `/seller/orders/${order.id}`,
    });
  }

  await alertCustomer({
    customerId: auth.session.user.id,
    orderId: order.id,
    title: "Delivered",
    message: `Order ${order.code} was delivered successfully.`,
    smsBody: formatOrderSms(order.code, "Delivered successfully. Thank you for shopping with us!"),
    type: "success",
    link: `/dashboard/orders/${order.id}`,
  });

  const email = auth.session.user.email;
  if (email) {
    try {
      await sendTemplateEmail({
        to: email,
        subject: `Delivered — ${order.code}`,
        template: "order-status-update.hbs",
        data: { orderCode: order.code, status: "delivered", message: "Your order was delivered successfully." },
      });
    } catch (e) {
      console.error("[confirm-delivery] email", e);
    }
  }

  return jsonSuccess({ delivered: true, orderCode: order.code });
}
