import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SellerShopForm } from "@/components/seller/seller-shop-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop settings" };

export default async function SellerShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/seller/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shop settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customize how your storefront appears on the marketplace.</p>
      </div>
      <SellerShopForm />
    </div>
  );
}
