import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SellerAdvertisementsClient } from "@/components/seller/seller-advertisements-client";

export const dynamic = "force-dynamic";

export default async function SellerAdvertisementsPage() {
  const session = await auth();
  if (session?.user?.role !== "seller") redirect("/seller/login");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advertisements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit paid placements for homepage banners, slideshows, and featured listings.
        </p>
      </div>
      <SellerAdvertisementsClient />
    </div>
  );
}
