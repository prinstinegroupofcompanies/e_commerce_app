import { jsonSuccess, jsonError } from "@/lib/api-response";
import { confirmMobileMoneyPayment } from "@/lib/mobile-money";

export const dynamic = "force-dynamic";

/**
 * Provider webhook stub — send { "reference": "MM-ORD-..." } with Bearer MOBILE_MONEY_WEBHOOK_SECRET
 */
export async function POST(request) {
  const secret = process.env.MOBILE_MONEY_WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return jsonError("Unauthorized", [], 401);
    }
  }

  const body = await request.json().catch(() => ({}));
  const reference = body.reference || body.paymentReference;
  if (!reference) return jsonError("Missing reference", [], 422);

  const result = await confirmMobileMoneyPayment(String(reference));
  if (!result.ok) return jsonError("Not found", [], 404);

  return jsonSuccess({ ok: true, orderId: result.orderId });
}
