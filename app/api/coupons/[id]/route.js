import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { couponUpdateBodySchema } from "@/lib/validators/coupon";

export const dynamic = "force-dynamic";

export async function PUT(request, context) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    if (!id) return jsonError("Missing id", [], 400);

    const body = await request.json();
    const parsed = couponUpdateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return jsonError("Coupon not found", [], 404);

    const data = parsed.data;
    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const dup = await prisma.coupon.findFirst({
        where: { code, NOT: { id } },
        select: { id: true },
      });
      if (dup) return jsonError("Coupon code already exists", [], 409);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code != null ? { code: data.code.trim().toUpperCase() } : {}),
        ...(data.title != null ? { title: data.title } : {}),
        ...(data.discountType != null ? { discountType: data.discountType } : {}),
        ...(data.discount != null ? { discount: data.discount } : {}),
        ...(data.minOrderAmount != null ? { minOrderAmount: data.minOrderAmount } : {}),
        ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
        ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit } : {}),
        ...(data.perUserLimit != null ? { perUserLimit: data.perUserLimit } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.expiresAt !== undefined
          ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
          : {}),
        ...(data.isActive != null ? { isActive: data.isActive } : {}),
      },
    });

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function DELETE(_request, context) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    if (!id) return jsonError("Missing id", [], 400);

    await prisma.coupon.delete({ where: { id } });
    return jsonSuccess({ deleted: true });
  } catch (e) {
    if (e?.code === "P2025") return jsonError("Coupon not found", [], 404);
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
