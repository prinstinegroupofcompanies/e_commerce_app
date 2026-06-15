import { getStripe } from "@/lib/stripe";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return jsonError("Stripe not configured", [], 503);
    }
    const body = await request.json();
    const amount = Math.round(Number(body?.amount || 0) * 100);
    if (!Number.isFinite(amount) || amount < 50) {
      return jsonError("Invalid amount", [], 422);
    }
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: (body?.currency || "usd").toLowerCase(),
      automatic_payment_methods: { enabled: true },
    });
    return jsonSuccess({ clientSecret: intent.client_secret, id: intent.id });
  } catch (e) {
    console.error(e);
    return jsonError("Stripe error", [String(e?.message || e)], 500);
  }
}
