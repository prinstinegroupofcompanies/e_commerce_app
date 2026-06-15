import { jsonError, jsonSuccess } from "@/lib/api-response";
import { sendAnalyticsReportEmail } from "@/lib/analytics-report-email";

export const dynamic = "force-dynamic";

/**
 * Weekly analytics email. Call with CRON_SECRET (Bearer or ?secret=).
 * Optional: ?days=7 (default 7)
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonError("Cron not configured", [], 503);
  }

  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  if (authHeader !== `Bearer ${secret}` && querySecret !== secret) {
    return jsonError("Unauthorized", [], 401);
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = daysParam ? Math.min(90, Math.max(1, parseInt(daysParam, 10) || 7)) : 7;

  const result = await sendAnalyticsReportEmail(days);
  return jsonSuccess(result);
}
