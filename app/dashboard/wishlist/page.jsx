import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomerWishlistView } from "@/components/customer/customer-wishlist-view";

export const dynamic = "force-dynamic";

export const metadata = { title: "Wishlist" };

export default async function CustomerWishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">Products you saved for later.</p>
      </div>
      <CustomerWishlistView />
    </div>
  );
}
