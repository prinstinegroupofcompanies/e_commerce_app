import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { confirmMobileMoneyPayment } from "@/lib/mobile-money";

export const dynamic = "force-dynamic";

/** Flutterwave webhook — verify `verif-hash` header matches FLUTTERWAVE_WEBHOOK_SECRET */
export async function POST(request) {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (secret) {
    const hash = request.headers.get("verif-hash");
    if (hash !== secret) return jsonError("Invalid signature", [], 401);
  }

  const payload = await request.json().catch(() => ({}));
  const data = payload?.data;
  if (payload?.event !== "charge.completed" || data?.status !== "successful") {
    return jsonSuccess({ received: true, ignored: true });
  }

  const txRef = data?.tx_ref;
  if (!txRef) return jsonError("Missing tx_ref", [], 422);

  const txn = await prisma.transaction.findFirst({
    where: { reference: txRef, status: "pending" },
  });
  if (!txn) return jsonSuccess({ received: true, duplicate: true });

  const result = await confirmMobileMoneyPayment(txRef, {
    flwTransactionId: data?.id,
  });

  return jsonSuccess({ ok: result.ok, orderId: result.orderId });
}
