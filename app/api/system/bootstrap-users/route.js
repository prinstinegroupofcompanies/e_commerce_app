import { jsonError, jsonSuccess } from "@/lib/api-response";
import { ensureProductionUsers } from "@/lib/production-users";

export const dynamic = "force-dynamic";

/**
 * One-time / maintenance endpoint to create verified production accounts.
 * Call: GET /api/system/bootstrap-users?secret=CRON_SECRET
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonError("Bootstrap not configured", [], 503);
  }

  const querySecret = request.nextUrl.searchParams.get("secret");
  const auth = request.headers.get("authorization");
  if (querySecret !== secret && auth !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", [], 401);
  }

  const result = await ensureProductionUsers();
  return jsonSuccess(result);
}
