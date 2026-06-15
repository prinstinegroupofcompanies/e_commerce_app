import { notify, notifyMany } from "@/lib/notify";
import { smsCustomer } from "@/lib/customer-sms";
import { sendWebPushToCustomer } from "@/lib/web-push";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall";

/**
 * In-app + SMS + web push for a single customer event.
 */
export async function alertCustomer({
  customerId,
  orderId,
  phone,
  title,
  message,
  smsBody,
  type = "info",
  link = null,
}) {
  if (customerId) {
    await notify({ customerId, title, message, type, link });
    try {
      await sendWebPushToCustomer(customerId, { title, body: message, url: link });
    } catch (e) {
      console.error("[alertCustomer] push", e);
    }
  }

  if (smsBody) {
    try {
      const smsResult = await smsCustomer({ customerId, orderId, phone, body: smsBody });
      if (smsResult?.skipped && customerId && process.env.NODE_ENV === "development") {
        await notify({
          customerId,
          title: `[SMS preview] ${title}`,
          message: smsBody,
          type: "info",
          link,
        });
      }
    } catch (e) {
      console.error("[alertCustomer] sms", e);
    }
  }
}

/**
 * @param {{ sellerIds: string[]; title: string; message: string; link?: string | null }}
 */
export async function alertSellers({ sellerIds, title, message, link }) {
  if (!sellerIds.length) return;
  await notifyMany({ sellerIds, title, message, type: "info", link });
}

export function formatOrderSms(code, extra) {
  return `${appName}: Order ${code}. ${extra}`.slice(0, 320);
}
