import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { parseAnalyticsRange } from "@/lib/chat/analytics-range";
import { getCustomerBehaviorDetail } from "@/lib/chat/analytics-admin";
import { AnalyticsPageClient } from "@/components/admin/analytics-page-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * @param {{ params: { id: string }; searchParams?: { days?: string } }} props
 */
export default async function CustomerBehaviorPage({ params, searchParams }) {
  await auth();
  const { days, since, until } = parseAnalyticsRange(searchParams);
  const data = await getCustomerBehaviorDetail(params.id, { days, since, until });
  if (!data) notFound();

  const { customer, insights, eventBreakdown } = data;
  const breakdownEntries = Object.entries(eventBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href={`/admin/analytics?days=${days}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to analytics
          </Link>
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member since {new Date(customer.createdAt).toLocaleDateString()} · {customer._count.orders} orders ·{" "}
              {customer._count.reviews} reviews
            </p>
          </div>
          <AnalyticsPageClient days={days} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Events ({days}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{data.eventCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Insight score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{insights.eventCount}</p>
            <p className="text-xs text-muted-foreground">90-day weighted history</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chat sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{data.chatSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitor linked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{data.profile ? "Yes" : "No profile"}</p>
            {data.profile ? (
              <p className="text-xs text-muted-foreground">
                Last seen {new Date(data.profile.lastSeenAt).toLocaleString()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {insights.recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent searches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{insights.recentSearches.join(", ")}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {breakdownEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events in this period.</p>
            ) : (
              breakdownEntries.map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {type}
                  </Badge>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm text-primary hover:underline">
                          {o.code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">${o.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {o.orderStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {data.chatSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assistant chats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.chatSessions.map((s) => (
              <div key={s.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Session {s.id.slice(0, 8)}… · updated {new Date(s.updatedAt).toLocaleString()}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {s.messages.map((m) => (
                    <li key={m.id}>
                      <span className="font-medium capitalize">{m.role}:</span>{" "}
                      <span className="text-muted-foreground">{m.content.slice(0, 120)}{m.content.length > 120 ? "…" : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            {since.toLocaleDateString()} – {until.toLocaleDateString()} (guest + logged-in, up to 100 events)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Product / path</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No events for this customer in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                data.events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {e.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm">
                      {e.product?.name ? (
                        <Link href={`/products/${e.product.slug}`} className="text-primary hover:underline" target="_blank">
                          {e.product.name}
                        </Link>
                      ) : (
                        e.path || "—"
                      )}
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
