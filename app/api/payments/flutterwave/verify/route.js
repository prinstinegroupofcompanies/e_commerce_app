import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { confirmMobileMoneyPayment } from "@/lib/mobile-money";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  txRef: z.string().min(3),
  transactionId: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

export async function POST(request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid payload", parsed.error.flatten().fieldErrors, 422);

  const { txRef, transactionId } = parsed.data;

  if (transactionId) {
    const verified = await verifyFlutterwaveTransaction(transactionId);
    if (!verified.ok) {
      return jsonSuccess({ confirmed: false, pending: true });
    }
  }

  const result = await confirmMobileMoneyPayment(txRef, {
    flwTransactionId: transactionId || undefined,
  });
  if (!result.ok) return jsonError("Payment not found or already processed", [], 404);

  const order = await prisma.order.findUnique({
    where: { id: result.orderId },
    select: { id: true, code: true, customerId: true },
  });

  if (order?.customerId) {
    await alertCustomer({
      customerId: order.customerId,
      orderId: order.id,
      title: "Payment received",
      message: `Mobile money payment for ${order.code} was confirmed.`,
      smsBody: formatOrderSms(order.code, "Payment received. Your order is being processed."),
      type: "success",
      link: `/dashboard/orders/${order.id}`,
    });
  }

  return jsonSuccess({ confirmed: true, orderCode: order?.code, orderId: result.orderId });
}
