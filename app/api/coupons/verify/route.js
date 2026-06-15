import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { code, subtotal } = parsed.data;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return jsonError("Invalid coupon", [], 400);
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return jsonError("Coupon not active yet", [], 400);
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return jsonError("Coupon expired", [], 400);
    }
    if (subtotal < coupon.minOrderAmount) {
      return jsonError("Order below minimum for this coupon", [], 400);
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subtotal * coupon.discount) / 100;
      if (coupon.maxDiscount != null) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discount;
    }

    discount = Math.min(discount, subtotal);

    return jsonSuccess({
      code: coupon.code,
      title: coupon.title,
      discount,
      discountType: coupon.discountType,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
