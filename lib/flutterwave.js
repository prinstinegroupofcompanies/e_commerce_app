/**
 * Flutterwave — single API for Orange Money, MTN MoMo, and cards (Liberia: LRD/USD).
 * Falls back to manual reference flow when keys are unset.
 */

const BASE = "https://api.flutterwave.com/v3";

export function isFlutterwaveConfigured() {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * @param {{ amount: number; email: string; phone: string; name: string; orderCode: string; method: string; currency?: string }}
 */
export async function createFlutterwaveMobileMoneyCharge({
  amount,
  email,
  phone,
  name,
  orderCode,
  method,
  currency = "USD",
}) {
  if (!isFlutterwaveConfigured()) {
    return { ok: false, error: "not_configured" };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const txRef = `MH-${orderCode}-${Date.now()}`;
  const network =
    method === "mtn_mobile_money" ? "MTN" : method === "orange_money" ? "ORANGE" : "MTN";

  const body = {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: `${base}/checkout/flutterwave-return?tx_ref=${encodeURIComponent(txRef)}`,
    customer: {
      email,
      phonenumber: phone,
      name,
    },
    customizations: {
      title: process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall",
      description: `Order ${orderCode}`,
    },
    payment_options: "mobilemoney",
    meta: { orderCode, method },
  };

  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== "success") {
    console.error("[flutterwave] payment init failed", json);
    return { ok: false, error: json.message || "flutterwave_failed" };
  }

  return {
    ok: true,
    txRef,
    reference: json.data?.id || txRef,
    paymentLink: json.data?.link,
    flwRef: json.data?.id,
  };
}

/**
 * Verify transaction after redirect or webhook.
 * @param {string | number} transactionId
 */
export async function verifyFlutterwaveTransaction(transactionId) {
  if (!isFlutterwaveConfigured()) return { ok: false, error: "not_configured" };

  const res = await fetch(`${BASE}/transactions/${transactionId}/verify`, {
    headers: headers(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== "success") {
    return { ok: false, error: "verify_failed" };
  }

  const data = json.data;
  const paid = data?.status === "successful";
  return {
    ok: paid,
    txRef: data?.tx_ref,
    amount: data?.amount,
    currency: data?.currency,
    meta: data?.meta,
  };
}
