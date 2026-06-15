import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sellerOrdersWhere, summarizeSellerLines } from "@/lib/seller-orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seller dashboard" };

const LOW_STOCK_AT = 5;

export default async function SellerDashboardPage() {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    orderCount,
    openOrdersCount,
    activeProductCount,
    lowStockCount,
    earningsAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: sellerOrdersWhere(sellerId) }),
    prisma.order.count({
      where: {
        ...sellerOrdersWhere(sellerId),
        orderStatus: { in: ["pending", "accepted", "processing"] },
      },
    }),
    prisma.product.count({ where: { sellerId, isActive: true } }),
    prisma.product.count({
      where: { sellerId, isActive: true, stockQuantity: { lte: LOW_STOCK_AT, gte: 0 } },
    }),
    prisma.orderItem.aggregate({
      where: {
        sellerId,
        order: { createdAt: { gte: since } },
      },
      _sum: { sellerEarning: true },
    }),
    prisma.order.findMany({
      where: sellerOrdersWhere(sellerId),
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: {
          where: { sellerId },
          select: { quantity: true, subtotal: true, commission: true, sellerEarning: true },
        },
      },
    }),
  ]);

  const monthEarning = earningsAgg._sum.sellerEarning ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your shop performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/seller/orders">All orders</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/seller/products/new">Add product</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{orderCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Orders containing your products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{openOrdersCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pending, accepted, or processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. earnings (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">${Number(monthEarning).toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sum of your line payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{activeProductCount}</p>
            {lowStockCount > 0 ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                {lowStockCount} active with stock ≤ {LOW_STOCK_AT}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Stock looks healthy</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/seller/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {recentOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No orders yet. When customers buy your products, they will appear here.
              </CardContent>
            </Card>
          ) : (
            recentOrders.map((o) => {
              const mine = summarizeSellerLines(o.items);
              return (
                <Link
                  key={o.id}
                  href={`/seller/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">{o.code}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-right">
                    <div>
                      <p className="text-sm text-muted-foreground">Your sales</p>
                      <p className="font-semibold tabular-nums">${mine.subtotal.toFixed(2)}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {o.orderStatus}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
