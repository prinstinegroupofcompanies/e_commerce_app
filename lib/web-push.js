import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@markayhall.local",
    publicKey,
    privateKey,
  );
  vapidReady = true;
  return true;
}

export function isWebPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * @param {string} customerId
 * @param {{ title: string; body: string; url?: string | null }} payload
 */
export async function sendWebPushToCustomer(customerId, payload) {
  if (!ensureVapid()) return { skipped: true, reason: "not_configured" };

  const subs = await prisma.pushSubscription.findMany({
    where: { customerId },
  });
  if (subs.length === 0) return { skipped: true, reason: "no_subscriptions" };

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard/notifications",
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      const keys = JSON.parse(sub.keys);
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        data,
      );
      sent++;
    } catch (err) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      console.error("[web-push] send failed", err?.statusCode || err);
    }
  }
  return { sent, total: subs.length };
}
