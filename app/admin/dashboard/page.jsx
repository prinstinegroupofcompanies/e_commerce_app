import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/brand";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await auth();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [products, orders, customers, sellers, refunds, behaviorEvents, chatSessions] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.seller.count(),
      prisma.refund.count({ where: { status: "pending" } }),
      prisma.userInteraction.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.chatSession.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

  const stats = [
    { label: "Products", value: products },
    { label: "Orders", value: orders },
    { label: "Customers", value: customers },
    { label: "Sellers", value: sellers },
    { label: "Pending refunds", value: refunds },
    { label: "Behavior events (30d)", value: behaviorEvents },
    { label: "Chat sessions (30d)", value: chatSessions },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your {SITE_NAME} marketplace.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/analytics">View shop analytics</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
