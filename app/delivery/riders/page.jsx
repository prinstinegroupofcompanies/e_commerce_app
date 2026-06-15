import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeliveryRidersClient } from "@/components/delivery/delivery-riders-client";

export const dynamic = "force-dynamic";

export default async function DeliveryRidersPage() {
  const session = await auth();
  if (session?.user?.role !== "delivery") redirect("/delivery/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riders</h1>
        <p className="text-sm text-muted-foreground">Manage riders and live GPS positions for customer tracking.</p>
      </div>
      <DeliveryRidersClient />
    </div>
  );
}
