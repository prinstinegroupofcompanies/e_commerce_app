import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { fireBackInStockAlerts } from "@/lib/stock-alerts";
import { clientIp, logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["activate", "deactivate", "delete", "feature", "unfeature"]),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", parsed.error.flatten().fieldErrors, 422);

  const { ids, action } = parsed.data;

  if (action === "delete") {
    // Soft delete: deactivate and unfeature in one update.
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false, isFeatured: false },
    });
    return jsonSuccess({ updated: result.count });
  }

  const dataMap = {
    activate: { isActive: true },
    deactivate: { isActive: false },
    feature: { isFeatured: true },
    unfeature: { isFeatured: false },
  };
  const data = dataMap[action];

  if (action === "activate") {
    const before = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, stockQuantity: true, isActive: true },
    });
    const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data });
    for (const p of before) {
      if (!p.isActive && p.stockQuantity > 0) {
        fireBackInStockAlerts(p.id).catch((err) => console.error("[bulk-stock-alert]", err));
      }
    }
    await logActivity({
      adminId: gate.session.user.id,
      action: `products.bulk_${action}`,
      subject: `${result.count} product(s)`,
      meta: { ids, action },
      ip: clientIp(request),
    });
    return jsonSuccess({ updated: result.count });
  }

  const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data });
  await logActivity({
    adminId: gate.session.user.id,
    action: `products.bulk_${action}`,
    subject: `${result.count} product(s)`,
    meta: { ids, action },
    ip: clientIp(request),
  });
  return jsonSuccess({ updated: result.count });
}
