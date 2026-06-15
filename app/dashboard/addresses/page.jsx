import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomerAddressesManager } from "@/components/customer/customer-addresses-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Addresses" };

export default async function CustomerAddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Addresses</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage shipping addresses for faster checkout.</p>
      </div>
      <CustomerAddressesManager />
    </div>
  );
}
