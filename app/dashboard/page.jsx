import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkayNotifySetup } from "@/components/customer/markay-notify-setup";

export const metadata = { title: "Overview" };

export default async function CustomerOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, walletBalance: true },
  });

  const recentOrders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, code: true, total: true, orderStatus: true, paymentStatus: true, createdAt: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello, {customer?.name}</h1>
        <p className="text-sm text-muted-foreground">{customer?.email}</p>
      </div>
      <MarkayNotifySetup />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">${(customer?.walletBalance ?? 0).toFixed(2)}</p>
        </CardContent>
      </Card>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent orders</h2>
        <div className="space-y-2">
          {recentOrders.length ? (
            recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 transition hover:bg-muted/50"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{o.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${o.total.toFixed(2)}</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {o.orderStatus}
                  </Badge>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
