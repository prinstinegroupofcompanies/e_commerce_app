import { prisma } from "@/lib/prisma";

/**
 * Record an admin activity log entry.
 * @param {{
 *   adminId?: string | null;
 *   action: string;
 *   subject: string;
 *   meta?: Record<string, unknown> | null;
 *   ip?: string | null;
 * }} opts
 */
export async function logActivity(opts) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId: opts.adminId || null,
        action: opts.action,
        subject: opts.subject,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
        ip: opts.ip || null,
      },
    });
  } catch (err) {
    console.error("[activity-log]", err);
  }
}

/** @param {import("next/server").NextRequest} request */
export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip") || null;
}
