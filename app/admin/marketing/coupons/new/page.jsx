import Link from "next/link";
import { auth } from "@/lib/auth";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  await auth();

  return (
    <div className="space-y-6">
      <Link href="/admin/marketing/coupons" className="text-sm text-muted-foreground hover:text-foreground">
        ← Coupons
      </Link>
      <CouponForm
        mode="create"
        listHref="/admin/marketing/coupons"
        initialValues={{
          code: "",
          title: "",
          discountType: "percentage",
          discount: 10,
          minOrderAmount: 0,
          maxDiscount: "",
          usageLimit: "",
          perUserLimit: 1,
          startsAt: "",
          expiresAt: "",
          isActive: true,
        }}
      />
    </div>
  );
}
