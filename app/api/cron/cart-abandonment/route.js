import { jsonError, jsonSuccess } from "@/lib/api-response";
import { processCartAbandonmentReminders } from "@/lib/cart-abandonment";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonError("Cron not configured", [], 503);
  }

  const auth = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  if (auth !== `Bearer ${secret}` && querySecret !== secret) {
    return jsonError("Unauthorized", [], 401);
  }

  const result = await processCartAbandonmentReminders();
  return jsonSuccess(result);
}
