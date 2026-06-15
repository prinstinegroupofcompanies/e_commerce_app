import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { adminOrderPatchSchema } from "@/lib/validators/order";
import { sendTemplateEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { ok: false, response: jsonError("Unauthorized", [], 401) };
  }
  return { ok: true, session };
}

export async function GET(_request, context) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = context.params;
  if (!id) return jsonError("Missing id", [], 400);

  const order = await prisma.order.findFirst({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, name: true } },
          seller: { select: { shopName: true, shopSlug: true } },
        },
      },
      statusHistory: { orderBy: { createdAt: "desc" } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) return jsonError("Order not found", [], 404);

  let shippingAddress;
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {
    shippingAddress = {};
  }

  return jsonSuccess({
    ...order,
    shippingAddress,
  });
}

export async function PATCH(request, context) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = context.params;
  if (!id) return jsonError("Missing id", [], 400);

  const body = await request.json();
  const parsed = adminOrderPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const { orderStatus, paymentStatus, trackingId, comment } = parsed.data;
  const trimmedComment = comment?.trim() || "";
  if (orderStatus == null && paymentStatus == null && trackingId === undefined && !trimmedComment) {
    return jsonError("Nothing to update", [], 400);
  }

  const existing = await prisma.order.findFirst({
    where: { id },
    select: { id: true, orderStatus: true, paymentStatus: true, trackingId: true },
  });
  if (!existing) return jsonError("Order not found", [], 404);

  const wouldChange =
    (orderStatus != null && orderStatus !== existing.orderStatus) ||
    (paymentStatus != null && paymentStatus !== existing.paymentStatus) ||
    (trackingId !== undefined && (trackingId || null) !== (existing.trackingId || null));
  if (!wouldChange && !trimmedComment) {
    const unchanged = await prisma.order.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, name: true } },
            seller: { select: { shopName: true, shopSlug: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!unchanged) return jsonError("Order not found", [], 404);
    let shippingAddress;
    try {
      shippingAddress = JSON.parse(unchanged.shippingAddress);
    } catch {
      shippingAddress = {};
    }
    return jsonSuccess({ ...unchanged, shippingAddress });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.order.findFirst({
        where: { id },
        select: { orderStatus: true, paymentStatus: true, trackingId: true },
      });
      if (!before) throw new Error("ORDER_NOT_FOUND");

      const data = {};
      if (orderStatus != null && orderStatus !== before.orderStatus) data.orderStatus = orderStatus;
      if (paymentStatus != null && paymentStatus !== before.paymentStatus) data.paymentStatus = paymentStatus;
      if (trackingId !== undefined) {
        const nextT = trackingId || null;
        if (nextT !== (before.trackingId || null)) data.trackingId = nextT;
      }

      if (Object.keys(data).length > 0) {
        await tx.order.update({ where: { id }, data });
      }

      const after = await tx.order.findFirst({
        where: { id },
        select: { orderStatus: true },
      });
      const statusForHistory = orderStatus ?? after?.orderStatus ?? before.orderStatus;

      const parts = [];
      if (paymentStatus != null && paymentStatus !== before.paymentStatus) parts.push(`Payment → ${paymentStatus}`);
      if (trackingId !== undefined && (trackingId || null) !== (before.trackingId || null)) {
        parts.push(`Tracking: ${trackingId || "cleared"}`);
      }
      if (trimmedComment) parts.push(trimmedComment);

      const changedFields = Object.keys(data).length > 0;
      if (changedFields || trimmedComment) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: statusForHistory,
            comment: parts.length ? parts.join(" · ") : null,
            createdBy: gate.session.user?.email || gate.session.user?.id || "admin",
          },
        });
      }
    });

    const updated = await prisma.order.findFirst({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    let shippingAddress;
    try {
      shippingAddress = updated ? JSON.parse(updated.shippingAddress) : {};
    } catch {
      shippingAddress = {};
    }

    const orderStatusChanged = orderStatus != null && orderStatus !== existing.orderStatus;
    const paymentStatusChanged = paymentStatus != null && paymentStatus !== existing.paymentStatus;
    if (orderStatusChanged || paymentStatusChanged) {
      const to = updated?.customer?.email || updated?.guestEmail;
      const bits = [];
      if (orderStatusChanged) bits.push(`Order: ${updated.orderStatus}`);
      if (paymentStatusChanged) bits.push(`Payment: ${updated.paymentStatus}`);
      const statusLine = bits.join(" · ");
      if (to && updated) {
        try {
          await sendTemplateEmail({
            to,
            subject: `Order ${updated.code} updated`,
            template: "order-status-update.hbs",
            data: {
              orderCode: updated.code,
              status: statusLine,
              comment: trimmedComment || undefined,
            },
          });
        } catch (err) {
          console.error("[orders] status email", err);
        }
      }

      if (updated?.customer?.id) {
        await notify({
          customerId: updated.customer.id,
          title: `Order ${updated.code} updated`,
          message: trimmedComment ? `${statusLine} — ${trimmedComment}` : statusLine,
          type: "info",
          link: `/dashboard/orders/${updated.id}`,
        });
      }
    }

    return jsonSuccess({ ...updated, shippingAddress });
  } catch (e) {
    if (e instanceof Error && e.message === "ORDER_NOT_FOUND") {
      return jsonError("Order not found", [], 404);
    }
    console.error(e);
    return jsonError("Update failed", [], 500);
  }
}
