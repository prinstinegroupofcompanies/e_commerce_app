import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/brand";
import { getAdminDashboardStats } from "@/lib/admin-dashboard";
import { AnalyticsBarChart } from "@/components/admin/analytics-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

function money(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminDashboardPage() {
  await auth();
  const data = await getAdminDashboardStats({ days: 30 });

  const stats = [
    { label: "Lifetime revenue", value: money(data.totals.lifetimeRevenue), highlight: true },
    { label: "Revenue (30d)", value: money(data.totals.periodRevenue) },
    { label: "Orders (30d)", value: data.totals.periodOrders },
    { label: "Products", value: data.totals.products },
    { label: "Orders (all)", value: data.totals.orders },
    { label: "Customers", value: data.totals.customers },
    { label: "Active sellers", value: data.totals.sellers },
    { label: "Pending refunds", value: data.totals.pendingRefunds },
    { label: "Stores to verify", value: data.totals.pendingSellers },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Marketplace overview for {SITE_NAME} — orders, revenue, and store performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/analytics">Shop analytics</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reports">Reports</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/orders">Manage orders</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className={s.highlight ? "border-primary/30 bg-primary/[0.03]" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders & revenue (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsBarChart
            series={[
              {
                key: "orders",
                label: "Orders",
                colorClass: "bg-primary/80",
                values: data.trend.map((d) => ({ label: d.label, value: d.orders })),
              },
              {
                key: "revenue",
                label: "Revenue ($)",
                colorClass: "bg-emerald-500/80",
                values: data.trend.map((d) => ({ label: d.label, value: Math.round(d.revenue) })),
              },
            ]}
            height={140}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order status breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.orderStatusGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              data.orderStatusGroups.map((row) => {
                const max = Math.max(...data.orderStatusGroups.map((r) => r.count), 1);
                return (
                  <div key={row.status}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{row.status.replace(/_/g, " ")}</span>
                      <span className="tabular-nums text-muted-foreground">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.paymentStatusGroups.map((row) => (
              <Badge key={row.status} variant="secondary" className="text-sm">
                {row.status}: {row.count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline">
                          {o.code}
                        </Link>
                        <div className="text-xs text-muted-foreground">{o.orderStatus}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.customer?.name || o.customer?.email || "Guest"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{money(o.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top stores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No active stores.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topSellers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/admin/sellers/${s.id}`} className="font-medium text-primary hover:underline">
                          {s.shopName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{s.shopCity || "—"}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s._count.products}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.totalOrders}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
