import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sales analytics" };

export default async function SellerAnalyticsPage() {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [items30, items7, topProducts, pendingAds] = await Promise.all([
    prisma.orderItem.findMany({
      where: { sellerId, order: { createdAt: { gte: since30 } } },
      select: { subtotal: true, sellerEarning: true, quantity: true, createdAt: true },
    }),
    prisma.orderItem.aggregate({
      where: { sellerId, order: { createdAt: { gte: since7 } } },
      _sum: { subtotal: true, sellerEarning: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { sellerId, order: { createdAt: { gte: since30 } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.storeAdvertisement.count({
      where: { sellerId, status: { in: ["pending", "active"] } },
    }),
  ]);

  const revenue30 = items30.reduce((s, i) => s + i.subtotal, 0);
  const earnings30 = items30.reduce((s, i) => s + i.sellerEarning, 0);
  const units30 = items30.reduce((s, i) => s + i.quantity, 0);

  const productIds = topProducts.map((t) => t.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days performance for your Markay Hall store.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">${revenue30.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Your earnings (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">${earnings30.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Units sold (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{units30}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              7d: ${(items7._sum.subtotal ?? 0).toFixed(2)} · {items7._count} line items
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top products (30d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground">No sales in this period yet.</p>
          ) : (
            topProducts.map((t) => {
              const p = productMap[t.productId];
              return (
                <div key={t.productId} className="flex justify-between gap-4 border-b py-2 last:border-0">
                  <span>{p?.name || "Product"}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {t._sum.quantity} sold · ${(t._sum.subtotal ?? 0).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <span>{pendingAds} active or pending advertisements</span>
          <Link href="/seller/advertisements" className="text-primary hover:underline">
            Manage ads →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
