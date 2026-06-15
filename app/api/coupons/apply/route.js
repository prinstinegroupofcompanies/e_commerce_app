import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(1).max(80),
  subtotal: z.coerce.number().nonnegative(),
});

/**
 * Stateless validator: returns the resolved discount for a code+subtotal pair.
 * Does NOT increment usage; that happens during checkout.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Provide code and subtotal", parsed.error.flatten().fieldErrors, 422);

    const code = parsed.data.code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return jsonError("Coupon not found", [], 404);

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return jsonError("Coupon not active yet", [], 400);
    if (coupon.expiresAt && now > coupon.expiresAt) return jsonError("Coupon has expired", [], 400);
    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
      return jsonError("Coupon usage limit reached", [], 400);
    }
    if (parsed.data.subtotal < coupon.minOrderAmount) {
      return jsonError(
        `Add $${(coupon.minOrderAmount - parsed.data.subtotal).toFixed(2)} more to use this coupon`,
        [],
        400,
      );
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (parsed.data.subtotal * coupon.discount) / 100;
      if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discount;
    }
    discount = Math.min(discount, parsed.data.subtotal);

    return jsonSuccess({
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discount: Number(discount.toFixed(2)),
      newTotal: Number((parsed.data.subtotal - discount).toFixed(2)),
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not apply coupon", [], 500);
  }
}
