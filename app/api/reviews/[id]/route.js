import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { z } from "zod";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isApproved: z.boolean().optional(),
  adminReply: z.string().max(2000).optional().nullable(),
});

export async function PATCH(request, context) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    if (!id) return jsonError("Missing id", [], 400);

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return jsonError("Review not found", [], 404);

    const { isApproved, adminReply } = parsed.data;
    if (isApproved === undefined && adminReply === undefined) {
      return jsonError("Nothing to update", [], 400);
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(isApproved !== undefined ? { isApproved } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
      },
      include: {
        product: { select: { name: true, slug: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (updated.customer?.id) {
      const approvedNow = isApproved === true && existing.isApproved === false;
      const replied = adminReply !== undefined && adminReply !== existing.adminReply && adminReply;
      if (approvedNow) {
        await notify({
          customerId: updated.customer.id,
          title: "Review published",
          message: `Your review on ${updated.product.name} is now live.`,
          type: "success",
          link: `/products/${updated.product.slug}`,
        });
      }
      if (replied) {
        await notify({
          customerId: updated.customer.id,
          title: "Store replied to your review",
          message: `${updated.product.name}: ${adminReply}`,
          type: "info",
          link: `/products/${updated.product.slug}`,
        });
      }
    }

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
