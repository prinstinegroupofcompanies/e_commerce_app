/**
 * PayPal Checkout (Orders v2) via REST API.
 */

const SANDBOX = "https://api-m.sandbox.paypal.com";
const LIVE = "https://api-m.paypal.com";

function apiBase() {
  return process.env.PAYPAL_MODE === "live" ? LIVE : SANDBOX;
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken = /** @type {{ token: string; expires: number } | null} */ (null);

async function getAccessToken() {
  if (!isPayPalConfigured()) return null;
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;

  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

/**
 * @param {{ amount: number; currency?: string; orderCode: string; returnUrl: string; cancelUrl: string }} opts
 */
export async function createPayPalOrder(opts) {
  const token = await getAccessToken();
  if (!token) throw new Error("PayPal not configured");

  const value = opts.amount.toFixed(2);
  const currency = (opts.currency || "USD").toUpperCase();

  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.orderCode,
          description: `Order ${opts.orderCode}`,
          amount: { currency_code: currency, value },
        },
      ],
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }

  const approve = data.links?.find((l) => l.rel === "approve");
  return {
    id: data.id,
    approvalUrl: approve?.href || null,
    status: data.status,
  };
}

/**
 * @param {string} paypalOrderId
 */
export async function capturePayPalOrder(paypalOrderId) {
  const token = await getAccessToken();
  if (!token) throw new Error("PayPal not configured");

  const res = await fetch(`${apiBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: data.id,
    status: data.status,
    captureId: capture?.id,
    amount: capture?.amount?.value,
  };
}
