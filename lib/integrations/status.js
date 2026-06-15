import { isSmsConfigured } from "@/lib/sms";
import { isWebPushConfigured } from "@/lib/web-push";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";

/**
 * Which optional integrations are active (for admin dashboard & setup scripts).
 */
export function getIntegrationStatus() {
  return {
    sms: {
      provider: isSmsConfigured() ? "twilio" : null,
      configured: isSmsConfigured(),
      env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
    },
    webPush: {
      configured: isWebPushConfigured(),
      env: ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
    },
    mobileMoney: {
      provider: isFlutterwaveConfigured() ? "flutterwave" : "manual",
      configured: isFlutterwaveConfigured(),
      env: ["FLUTTERWAVE_SECRET_KEY", "NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY"],
    },
    email: {
      configured: Boolean(process.env.SMTP_HOST),
      env: ["SMTP_HOST"],
    },
  };
}
