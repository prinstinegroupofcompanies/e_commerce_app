import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/coupon-form";
import { toDatetimeLocalValue } from "@/lib/datetime-local";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit coupon" };

export default async function EditCouponPage({ params }) {
  await auth();
  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/marketing/coupons" className="text-sm text-muted-foreground hover:text-foreground">
        ← Coupons
      </Link>
      <CouponForm
        mode="edit"
        couponId={coupon.id}
        listHref="/admin/marketing/coupons"
        initialValues={{
          code: coupon.code,
          title: coupon.title,
          discountType: coupon.discountType,
          discount: coupon.discount,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscount: coupon.maxDiscount ?? "",
          usageLimit: coupon.usageLimit ?? "",
          perUserLimit: coupon.perUserLimit,
          startsAt: toDatetimeLocalValue(coupon.startsAt),
          expiresAt: toDatetimeLocalValue(coupon.expiresAt),
          isActive: coupon.isActive,
        }}
      />
    </div>
  );
}
