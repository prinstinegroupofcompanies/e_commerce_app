import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DeliveryDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "delivery") redirect("/delivery/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Delivery dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {session.user.name}. Manage pickups, live tracking updates, and delivery completion.
      </p>
      <Button asChild>
        <Link href="/delivery/assignments">View delivery requests</Link>
      </Button>
    </div>
  );
}
