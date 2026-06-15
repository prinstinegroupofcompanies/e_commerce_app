import { jsonError, jsonSuccess } from "@/lib/api-response";
import { isPayPalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/** Legacy stub — use checkout + /api/payments/paypal/capture instead. */
export async function POST() {
  if (!isPayPalConfigured()) {
    return jsonError("PayPal not configured", [], 503);
  }
  return jsonSuccess({
    note: "Create PayPal orders via POST /api/checkout with paymentMethod: paypal, then capture at /api/payments/paypal/capture.",
  });
}
