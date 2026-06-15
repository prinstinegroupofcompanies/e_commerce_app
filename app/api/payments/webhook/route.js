import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return jsonError("Webhook not configured", [], 503);
  }

  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return jsonError("Missing stripe-signature", [], 400);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed", err);
    return jsonError("Invalid signature", [], 400);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (!orderId) {
          console.warn("[stripe-webhook] payment_intent.succeeded missing orderId metadata", pi.id);
          break;
        }
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, paymentStatus: true, orderStatus: true },
        });
        if (!order) {
          console.warn("[stripe-webhook] order not found", orderId);
          break;
        }
        if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
          break;
        }
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: "paid" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: order.orderStatus,
              comment: "Stripe: payment succeeded",
              createdBy: "stripe-webhook",
            },
          });
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (!orderId) break;
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, paymentStatus: true, orderStatus: true },
        });
        if (!order) break;
        if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
          break;
        }
        if (order.paymentStatus === "failed") {
          break;
        }
        const reason = pi.last_payment_error?.message || "unknown";
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: "failed" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: order.orderStatus,
              comment: `Stripe: payment failed — ${reason}`,
              createdBy: "stripe-webhook",
            },
          });
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error", e);
    return jsonError("Processing failed", [], 500);
  }

  return jsonSuccess({ received: true });
}
