import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { refundPatchSchema } from "@/lib/validators/refund";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(request, context) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    if (!id) return jsonError("Missing id", [], 400);

    const body = await request.json();
    const parsed = refundPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const existing = await prisma.refund.findUnique({ where: { id } });
    if (!existing) return jsonError("Refund not found", [], 404);

    const { status, adminNote, refundMethod } = parsed.data;
    if (status == null && adminNote === undefined && refundMethod === undefined) {
      return jsonError("Nothing to update", [], 400);
    }

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        ...(status != null ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
        ...(refundMethod !== undefined ? { refundMethod } : {}),
      },
      include: {
        order: { select: { id: true, code: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    const statusChanged = status != null && status !== existing.status;
    if (statusChanged && updated.customer?.id) {
      const map = {
        approved: { type: "success", label: "approved" },
        rejected: { type: "warning", label: "rejected" },
        completed: { type: "success", label: "completed" },
        pending: { type: "info", label: "set to pending" },
      };
      const meta = map[status] || { type: "info", label: status };
      await notify({
        customerId: updated.customer.id,
        title: `Refund ${meta.label}`,
        message: `Your refund request on order ${updated.order?.code || ""} was ${meta.label}.${
          adminNote ? ` Note: ${adminNote}` : ""
        }`,
        type: meta.type,
        link: `/dashboard/refunds`,
      });
    }

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
