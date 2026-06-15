import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeliveryAssignmentsClient } from "@/components/delivery/delivery-assignments-client";

export const dynamic = "force-dynamic";

export default async function DeliveryAssignmentsPage() {
  const session = await auth();
  if (session?.user?.role !== "delivery") redirect("/delivery/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Delivery requests</h1>
      <DeliveryAssignmentsClient />
    </div>
  );
}
