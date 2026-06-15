import Link from "next/link";
import { auth } from "@/lib/auth";
import { parseAnalyticsRange } from "@/lib/chat/analytics-range";
import { getAdminAnalyticsSummary } from "@/lib/chat/analytics-admin";
import { AnalyticsPageClient } from "@/components/admin/analytics-page-client";
import { AnalyticsBarChart } from "@/components/admin/analytics-bar-chart";
import { AnalyticsCronHint } from "@/components/admin/analytics-cron-hint";
import { visitorAnalyticsHref } from "@/lib/chat/visitor-key-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop analytics" };

const FUNNEL_LABELS = {
  page_view: "Page views",
  view_product: "Product views",
  add_to_cart: "Add to cart",
  wishlist_add: "Wishlist",
  compare_add: "Compare",
  purchase: "Purchases",
  review: "Reviews",
  chat_open: "Chat opened",
};

/**
 * @param {{ searchParams?: { days?: string } }} props
 */
export default async function AdminAnalyticsPage({ searchParams }) {
  await auth();
  const { days, since, until } = parseAnalyticsRange(searchParams);
  const data = await getAdminAnalyticsSummary({ days, since, until });

  const stats = [
    { label: `Events (${days}d)`, value: data.totalEvents },
    { label: "Unique visitors", value: data.uniqueVisitors },
    { label: "Visitor profiles", value: data.visitorProfiles },
    { label: "Logged-in visitors", value: data.linkedCustomers },
    { label: "Chat sessions", value: data.chatSessions },
    { label: "Chat messages", value: data.chatMessages },
  ];

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1);
  const periodLabel = `${since.toLocaleDateString()} – ${until.toLocaleDateString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop analytics</h1>
          <p className="text-sm text-muted-foreground">
            Customer behavior, assistant usage, and conversion signals · {periodLabel}
          </p>
        </div>
        <AnalyticsPageClient days={days} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            All events vs purchases
            {data.dailyTrend.length > 45 ? " (weekly totals for long ranges)" : " (daily)"}.
          </p>
        </CardHeader>
        <CardContent>
          <AnalyticsBarChart
            series={[
              {
                key: "events",
                label: "All events",
                colorClass: "bg-primary/80",
                values: data.dailyTrend.map((d) => ({ label: d.label, value: d.events })),
              },
              {
                key: "purchases",
                label: "Purchases",
                colorClass: "bg-emerald-500/80",
                values: data.dailyTrend.map((d) => ({ label: d.label, value: d.purchases })),
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.funnel.map((f) => (
              <div key={f.eventType}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{FUNNEL_LABELS[f.eventType] || f.eventType}</span>
                  <span className="tabular-nums text-muted-foreground">{f.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((f.count / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events by type</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.eventBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No events in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.eventBreakdown.map((e) => (
                    <TableRow key={e.eventType}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {e.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.count}</TableCell>
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
          <CardTitle className="text-base">Most active guests</CardTitle>
          <p className="text-sm text-muted-foreground">Anonymous visitors (not linked to an account).</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No guest activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.topGuests.map((row) => (
                  <TableRow key={row.visitorKey}>
                    <TableCell className="font-mono text-sm">{row.visitorShort}…</TableCell>
                    <TableCell className="text-right tabular-nums">{row.eventCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={visitorAnalyticsHref(row.visitorKey, days)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View behavior
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most active customers</CardTitle>
          <p className="text-sm text-muted-foreground">Registered users with the most tracked events in this period.</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No logged-in customer activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.topCustomers.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell>
                      <div className="font-medium">{row.customer?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{row.customer?.email}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.eventCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/analytics/customers/${row.customerId}?days=${days}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View behavior
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most engaged products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No product interactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topProducts.map((row) => (
                    <TableRow key={row.productId}>
                      <TableCell className="text-sm">
                        {row.product ? (
                          <Link
                            href={`/admin/products/${row.productId}/edit`}
                            className="text-primary hover:underline"
                          >
                            {row.product.name}
                          </Link>
                        ) : (
                          row.productId
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most engaged sellers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No seller interactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topSellers.map((row) => (
                    <TableRow key={row.sellerId}>
                      <TableCell className="text-sm">
                        {row.seller ? (
                          <Link href={`/admin/sellers/${row.sellerId}`} className="text-primary hover:underline">
                            {row.seller.shopName || row.seller.name}
                          </Link>
                        ) : (
                          row.sellerId
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
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
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No recent events.
                  </TableCell>
                </TableRow>
              ) : (
                data.recentEvents.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {e.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.customer ? (
                        <Link
                          href={`/admin/analytics/customers/${e.customerId}?days=${days}`}
                          className="text-primary hover:underline"
                          title={e.customer.email}
                        >
                          {e.customer.name || e.customer.email}
                        </Link>
                      ) : (
                        <Link
                          href={visitorAnalyticsHref(e.visitorKey, days)}
                          className="text-muted-foreground hover:text-primary hover:underline"
                        >
                          Guest · {e.visitorShort}…
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {e.product?.name || e.path || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AnalyticsCronHint
        hasSmtp={Boolean(process.env.SMTP_HOST)}
        hasCron={Boolean(process.env.CRON_SECRET)}
      />
    </div>
  );
}
