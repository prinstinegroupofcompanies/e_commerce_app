import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await auth();

  const now = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    monthRevenue,
    yearRevenue,
    paidOrders,
    pendingOrders,
    totalProducts,
    totalCustomers,
    activeSellers,
    topProducts,
    topSellers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "paid", createdAt: { gte: monthAgo } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "paid", createdAt: { gte: yearAgo } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.order.count({ where: { orderStatus: { in: ["pending", "accepted", "processing"] } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.seller.count({ where: { isActive: true } }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 8,
    }),
    prisma.orderItem.groupBy({
      by: ["sellerId"],
      where: { sellerId: { not: null } },
      _sum: { subtotal: true, sellerEarning: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, code: true, total: true, orderStatus: true, paymentStatus: true, createdAt: true },
    }),
  ]);

  const sellerIds = topSellers.map((s) => s.sellerId).filter(Boolean);
  const sellerMap = new Map();
  if (sellerIds.length) {
    const rows = await prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, shopName: true },
    });
    rows.forEach((r) => sellerMap.set(r.id, r.shopName || r.name));
  }

  const stats = [
    { label: "Revenue (30d)", value: `$${(monthRevenue._sum.total ?? 0).toFixed(2)}` },
    { label: "Orders (30d)", value: monthRevenue._count._all },
    { label: "Revenue (12mo)", value: `$${(yearRevenue._sum.total ?? 0).toFixed(2)}` },
    { label: "Paid orders", value: paidOrders },
    { label: "Open orders", value: pendingOrders },
    { label: "Active products", value: totalProducts },
    { label: "Customers", value: totalCustomers },
    { label: "Active sellers", value: activeSellers },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Key marketplace metrics and best performers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products (by revenue)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No sales yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="text-sm font-medium">{p.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{p._sum.quantity ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">${(p._sum.subtotal ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top sellers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No seller sales yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  topSellers.map((s) => (
                    <TableRow key={s.sellerId || "anon"}>
                      <TableCell className="text-sm">
                        <Link href={`/admin/sellers/${s.sellerId}`} className="text-primary hover:underline">
                          {sellerMap.get(s.sellerId) || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">${(s._sum.subtotal ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">${(s._sum.sellerEarning ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm text-primary hover:underline">
                        {o.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${o.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{o.orderStatus}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
