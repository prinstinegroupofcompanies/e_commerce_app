import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { notifyMany } from "@/lib/notify";
import { clientIp, logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  orderStatus: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  comment: z.string().max(500).optional(),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", parsed.error.flatten().fieldErrors, 422);

  const { ids, orderStatus, paymentStatus, comment } = parsed.data;
  if (!orderStatus && !paymentStatus && !comment) {
    return jsonError("Nothing to update", [], 400);
  }

  const before = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      code: true,
      orderStatus: true,
      paymentStatus: true,
      customerId: true,
    },
  });

  if (before.length === 0) return jsonSuccess({ updated: 0 });

  const data = {};
  if (orderStatus) data.orderStatus = orderStatus;
  if (paymentStatus) data.paymentStatus = paymentStatus;

  let updatedCount = 0;
  if (Object.keys(data).length > 0) {
    const result = await prisma.order.updateMany({
      where: { id: { in: before.map((o) => o.id) } },
      data,
    });
    updatedCount = result.count;
  }

  const trimmedComment = (comment || "").trim();
  const createdBy = gate.session.user?.email || gate.session.user?.id || "admin";
  for (const o of before) {
    const orderStatusChanged = orderStatus && orderStatus !== o.orderStatus;
    const paymentStatusChanged = paymentStatus && paymentStatus !== o.paymentStatus;
    if (orderStatusChanged || paymentStatusChanged || trimmedComment) {
      const parts = [];
      if (orderStatusChanged) parts.push(`Order → ${orderStatus}`);
      if (paymentStatusChanged) parts.push(`Payment → ${paymentStatus}`);
      if (trimmedComment) parts.push(trimmedComment);
      await prisma.orderStatusHistory.create({
        data: {
          orderId: o.id,
          status: orderStatus ?? o.orderStatus,
          comment: parts.length ? parts.join(" · ") : null,
          createdBy,
        },
      });
    }
  }

  const customerIds = before
    .filter((o) => (orderStatus && o.orderStatus !== orderStatus) || (paymentStatus && o.paymentStatus !== paymentStatus))
    .map((o) => o.customerId)
    .filter(Boolean);
  if (customerIds.length > 0) {
    const statusLine = [orderStatus && `Order: ${orderStatus}`, paymentStatus && `Payment: ${paymentStatus}`]
      .filter(Boolean)
      .join(" · ");
    await notifyMany({
      customerIds,
      title: "Your order was updated",
      message: trimmedComment ? `${statusLine} — ${trimmedComment}` : statusLine,
      type: "info",
    });
  }

  await logActivity({
    adminId: gate.session.user.id,
    action: "orders.bulk_update",
    subject: `${before.length} order(s)`,
    meta: { ids, orderStatus, paymentStatus, comment: trimmedComment || null, updated: updatedCount },
    ip: clientIp(request),
  });

  return jsonSuccess({ updated: updatedCount, processed: before.length });
}
