import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["accept", "reject", "pickup", "out_for_delivery", "arrived", "assign_rider"]),
  riderId: z.string().optional(),
  riderLat: z.number().optional(),
  riderLng: z.number().optional(),
  etaMinutes: z.coerce.number().int().positive().optional(),
});

const STATUS_MAP = {
  accept: "accepted",
  reject: "rejected",
  pickup: "picked_up",
  out_for_delivery: "out_for_delivery",
  arrived: "arrived",
};

export async function PATCH(request, { params }) {
  const auth = await requireSessionRoles(["delivery"]);
  if (!auth.ok) return auth.response;
  const companyId = auth.session.user.id;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: params.id, deliveryCompanyId: companyId },
    include: { order: { select: { id: true, code: true, customerId: true } } },
  });
  if (!assignment) return jsonError("Assignment not found", [], 404);

  const { action, riderId, riderLat, riderLng, etaMinutes } = parsed.data;
  const data = { updatedAt: new Date() };

  if (action === "assign_rider" && riderId) {
    const rider = await prisma.deliveryRider.findFirst({
      where: { id: riderId, companyId, isActive: true },
    });
    if (!rider) return jsonError("Rider not found", [], 404);
    data.riderId = riderId;
    if (rider.currentLat != null && rider.currentLng != null) {
      data.riderLat = rider.currentLat;
      data.riderLng = rider.currentLng;
    }
  } else if (STATUS_MAP[action]) {
    data.status = STATUS_MAP[action];
    if (action === "pickup") data.pickedUpAt = new Date();
    if (action === "arrived") data.status = "arrived";
    if (riderLat != null) data.riderLat = riderLat;
    if (riderLng != null) data.riderLng = riderLng;
    if (etaMinutes != null) data.etaMinutes = etaMinutes;
  } else if (action === "reject") {
    data.status = "rejected";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const a = await tx.deliveryAssignment.update({
      where: { id: assignment.id },
      data,
    });

    if (action === "pickup") {
      await tx.orderItem.updateMany({
        where: { deliveryAssignmentId: assignment.id },
        data: { deliveryStatus: "picked_up" },
      });
      await tx.order.update({
        where: { id: assignment.orderId },
        data: { orderStatus: "shipped" },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: assignment.orderId,
          status: "picked_up",
          comment: "Rider picked up package",
          createdBy: companyId,
        },
      });
    }

    if (action === "out_for_delivery") {
      await tx.orderItem.updateMany({
        where: { deliveryAssignmentId: assignment.id },
        data: { deliveryStatus: "out_for_delivery" },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: assignment.orderId,
          status: "out_for_delivery",
          comment: "Package out for delivery",
          createdBy: companyId,
        },
      });
    }

    if (action === "arrived") {
      await tx.orderItem.updateMany({
        where: { deliveryAssignmentId: assignment.id },
        data: { deliveryStatus: "arrived" },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: assignment.orderId,
          status: "arrived",
          comment: "Rider arrived at destination",
          createdBy: companyId,
        },
      });
    }

    if (riderLat != null && riderLng != null && data.riderId) {
      await tx.deliveryRider.update({
        where: { id: data.riderId },
        data: { currentLat: riderLat, currentLng: riderLng, lastLocationAt: new Date() },
      });
    }

    return a;
  });

  if (assignment.order.customerId && ["pickup", "out_for_delivery", "arrived", "accept"].includes(action)) {
    const label = action.replace(/_/g, " ");
    await alertCustomer({
      customerId: assignment.order.customerId,
      orderId: assignment.order.id,
      title: "Delivery update",
      message: `Order ${assignment.order.code}: ${label}`,
      smsBody: formatOrderSms(assignment.order.code, `Delivery update: ${label}.`),
      type: "info",
      link: `/dashboard/orders/${assignment.order.id}`,
    });
  }

  return jsonSuccess(updated);
}
