import { prisma } from "@/lib/prisma";
import { createFlutterwaveMobileMoneyCharge, isFlutterwaveConfigured } from "@/lib/flutterwave";

const MOBILE_METHODS = ["orange_money", "mtn_mobile_money"];

export function isMobileMoneyMethod(method) {
  return MOBILE_METHODS.includes(method);
}

function makeReference(orderCode) {
  return `MM-${orderCode}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Start a pending mobile-money payment (integrate Orange/MTN APIs here when credentials exist).
 * @param {{ orderId: string; orderCode: string; amount: number; method: string; customerId?: string | null; phone?: string | null }}
 */
export async function initiateMobileMoneyPayment({
  orderId,
  orderCode,
  amount,
  method,
  customerId,
  phone,
  email,
  customerName,
}) {
  const provider = method === "orange_money" ? "Orange Money" : "MTN Mobile Money";

  if (isFlutterwaveConfigured() && email && phone) {
    const flw = await createFlutterwaveMobileMoneyCharge({
      amount,
      email,
      phone,
      name: customerName || "Customer",
      orderCode,
      method,
    });
    if (flw.ok) {
      await prisma.transaction.create({
        data: {
          orderId,
          customerId,
          type: "payment",
          method,
          amount,
          status: "pending",
          reference: flw.txRef,
          meta: JSON.stringify({
            provider: "flutterwave",
            flwRef: flw.flwRef,
            paymentLink: flw.paymentLink,
          }),
        },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "pending", trackingId: flw.txRef },
      });
      return {
        reference: flw.txRef,
        provider,
        instructions: `Complete ${provider} payment securely via Flutterwave.`,
        pending: true,
        paymentLink: flw.paymentLink,
        viaFlutterwave: true,
      };
    }
  }

  const reference = makeReference(orderCode);

  await prisma.transaction.create({
    data: {
      orderId,
      customerId,
      type: "payment",
      method,
      amount,
      status: "pending",
      reference,
      meta: JSON.stringify({ provider, phone: phone || null, instructions: "awaiting_customer_approval" }),
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "pending",
      trackingId: reference,
    },
  });

  const ussdHint =
    method === "orange_money"
      ? "#144# or Orange Money app"
      : "*156# or MTN MoMo app";

  return {
    reference,
    provider,
    instructions: `Pay $${amount.toFixed(2)} via ${provider}. Use reference ${reference} on ${ussdHint}. Your order will confirm once payment is received.`,
    pending: true,
  };
}

/**
 * Mark mobile-money transaction paid (webhook or admin confirm).
 * @param {string} reference
 */
export async function confirmMobileMoneyPayment(reference, { flwTransactionId } = {}) {
  if (flwTransactionId && isFlutterwaveConfigured()) {
    const { verifyFlutterwaveTransaction } = await import("@/lib/flutterwave");
    const verified = await verifyFlutterwaveTransaction(flwTransactionId);
    if (!verified.ok) return { ok: false, error: "verify_failed" };
    reference = verified.txRef || reference;
  }

  const txn = await prisma.transaction.findFirst({
    where: { reference, status: "pending", method: { in: MOBILE_METHODS } },
  });
  if (!txn?.orderId) return { ok: false, error: "not_found" };

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: txn.id },
      data: { status: "completed" },
    });
    await tx.order.update({
      where: { id: txn.orderId },
      data: { paymentStatus: "paid", orderStatus: "accepted" },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: txn.orderId,
        status: "accepted",
        comment: `${txn.method} payment confirmed (${reference})`,
        createdBy: "payment",
      },
    });
  });

  return { ok: true, orderId: txn.orderId };
}
