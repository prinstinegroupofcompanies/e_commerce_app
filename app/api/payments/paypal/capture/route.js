import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { capturePayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isPayPalConfigured()) {
    return jsonError("PayPal not configured", [], 503);
  }

  try {
    const body = await request.json();
    const paypalOrderId = body?.paypalOrderId?.trim();
    const orderCode = body?.orderCode?.trim();

    if (!paypalOrderId) {
      return jsonError("Missing PayPal order id", [], 422);
    }

    const order = await prisma.order.findFirst({
      where: orderCode ? { code: orderCode } : { trackingId: paypalOrderId },
      select: {
        id: true,
        code: true,
        paymentStatus: true,
        orderStatus: true,
        paymentMethod: true,
        customerId: true,
        total: true,
      },
    });

    if (!order) return jsonError("Order not found", [], 404);
    if (order.paymentMethod !== "paypal") {
      return jsonError("Order is not a PayPal checkout", [], 400);
    }
    if (order.paymentStatus === "paid") {
      return jsonSuccess({ code: order.code, alreadyPaid: true });
    }

    const captured = await capturePayPalOrder(paypalOrderId);

    if (captured.status !== "COMPLETED") {
      return jsonError("PayPal payment was not completed", [], 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", trackingId: paypalOrderId },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.orderStatus,
          comment: `PayPal: payment captured (${captured.captureId || paypalOrderId})`,
          createdBy: "paypal",
        },
      });
      await tx.transaction.updateMany({
        where: { orderId: order.id, method: "paypal" },
        data: { status: "completed", reference: captured.captureId || paypalOrderId },
      });
    });

    if (order.customerId) {
      try {
        await notify({
          customerId: order.customerId,
          title: "Payment received",
          message: `PayPal payment for order ${order.code} was successful.`,
          type: "success",
          link: `/dashboard/orders/${order.id}`,
        });
      } catch (err) {
        console.error("[paypal-capture] notify", err);
      }
    }

    return jsonSuccess({ code: order.code, status: captured.status });
  } catch (e) {
    console.error(e);
    return jsonError(e instanceof Error ? e.message : "PayPal capture failed", [], 500);
  }
}
