import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/api-response";

/**
 * @param {("admin"|"seller"|"customer"|"delivery")[]} roles
 */
export async function requireSessionRoles(roles) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !role || !roles.includes(role)) {
    return {
      ok: false,
      response: jsonError("Unauthorized", [], 401),
    };
  }
  return { ok: true, session, role };
}
