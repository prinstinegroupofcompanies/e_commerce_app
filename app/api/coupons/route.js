import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { couponCreateBodySchema } from "@/lib/validators/coupon";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = couponCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const data = parsed.data;
    const code = data.code.trim().toUpperCase();

    const dup = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (dup) return jsonError("Coupon code already exists", [], 409);

    const created = await prisma.coupon.create({
      data: {
        code,
        title: data.title,
        discountType: data.discountType,
        discount: data.discount,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
      },
    });

    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
