import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Confirms Stripe payment after redirect (useful when webhooks are not wired in dev). */
export async function POST(request) {
  const stripe = getStripe();
  if (!stripe) return jsonError("Stripe not configured", [], 503);

  try {
    const body = await request.json();
    const paymentIntentId = body?.paymentIntentId?.trim();
    const orderCode = body?.orderCode?.trim();

    if (!paymentIntentId) return jsonError("Missing payment intent id", [], 422);

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderId = pi.metadata?.orderId;
    const metaCode = pi.metadata?.orderCode;

    const order = await prisma.order.findFirst({
      where: orderCode
        ? { code: orderCode }
        : orderId
          ? { id: orderId }
          : metaCode
            ? { code: metaCode }
            : { id: "___none___" },
      select: { id: true, code: true, paymentStatus: true, orderStatus: true, paymentMethod: true },
    });

    if (!order) return jsonError("Order not found", [], 404);
    if (order.paymentMethod !== "stripe") {
      return jsonError("Order is not a Stripe checkout", [], 400);
    }

    if (pi.status === "succeeded") {
      if (order.paymentStatus !== "paid") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: "paid" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: order.orderStatus,
              comment: "Stripe: payment confirmed on return",
              createdBy: "stripe-return",
            },
          });
          await tx.transaction.updateMany({
            where: { orderId: order.id, method: "stripe" },
            data: { status: "completed", reference: paymentIntentId },
          });
        });
      }
      return jsonSuccess({ code: order.code, status: "paid" });
    }

    if (pi.status === "processing") {
      return jsonSuccess({ code: order.code, status: "processing" });
    }

    return jsonSuccess({ code: order.code, status: pi.status, paid: false });
  } catch (e) {
    console.error(e);
    return jsonError("Could not confirm payment", [], 500);
  }
}
