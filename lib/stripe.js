import Stripe from "stripe";

/**
 * @returns {Stripe | null}
 */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
