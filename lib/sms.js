/**
 * SMS via Twilio (recommended) or generic HTTP webhook.
 * Skips silently when not configured (same pattern as email).
 */

function normalizePhone(raw) {
  if (!raw?.trim()) return null;
  let p = raw.trim().replace(/[^\d+]/g, "");
  if (!p.startsWith("+") && p.length >= 9) {
    if (p.startsWith("231")) p = `+${p}`;
    else if (p.startsWith("0")) p = `+231${p.slice(1)}`;
    else p = `+${p}`;
  }
  return p.length >= 10 ? p : null;
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  ) || Boolean(process.env.SMS_WEBHOOK_URL);
}

/**
 * @param {{ to: string; body: string }} opts
 */
export async function sendSms(opts) {
  const to = normalizePhone(opts.to);
  if (!to) {
    console.warn("[sms] invalid phone, skipping");
    return { skipped: true, reason: "invalid_phone" };
  }

  const body = opts.body?.trim();
  if (!body) return { skipped: true, reason: "empty_body" };

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[sms] Twilio error", res.status, errText);
      return { sent: false, error: "twilio_failed" };
    }
    return { sent: true, provider: "twilio" };
  }

  const webhook = process.env.SMS_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, body, source: "markay_hall" }),
    });
    if (!res.ok) {
      console.error("[sms] webhook error", res.status);
      return { sent: false, error: "webhook_failed" };
    }
    return { sent: true, provider: "webhook" };
  }

  console.warn("[sms] not configured; would send to", to, ":", body.slice(0, 80));
  return { skipped: true, reason: "not_configured" };
}
