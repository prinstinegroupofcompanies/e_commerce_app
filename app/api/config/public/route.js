import { jsonSuccess } from "@/lib/api-response";
import { isSmsConfigured } from "@/lib/sms";
import { isWebPushConfigured } from "@/lib/web-push";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";

export const dynamic = "force-dynamic";

/** Storefront / dashboard feature flags (no secrets). */
export async function GET() {
  return jsonSuccess({
    sms: isSmsConfigured(),
    webPush: isWebPushConfigured(),
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
    flutterwave: isFlutterwaveConfigured(),
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall",
  });
}
