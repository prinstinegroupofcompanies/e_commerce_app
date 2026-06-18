import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sellerOrdersWhere, summarizeSellerLines } from "@/lib/seller-orders";
import { SellerOrderLineFulfillment } from "@/components/seller/seller-order-line-fulfillment";
import { SellerOrderActions } from "@/components/seller/seller-order-actions";
import { formatOrderStatus } from "@/lib/order-labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const session = await auth();
  const sellerId = session?.user?.role === "seller" ? session.user.id : null;
  const { id } = params;
  if (!sellerId) return { title: "Order" };
  const order = await prisma.order.findFirst({
    where: { id, ...sellerOrdersWhere(sellerId) },
    select: { code: true },
  });
  return { title: order ? `Order ${order.code}` : "Order" };
}

export default async function SellerOrderDetailPage({ params }) {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const { id } = params;

  const order = await prisma.order.findFirst({
    where: { id, ...sellerOrdersWhere(sellerId) },
    include: {
      items: {
        where: { sellerId },
        include: {
          product: { select: { id: true, slug: true, name: true } },
        },
      },
      statusHistory: { orderBy: { createdAt: "desc" } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) notFound();

  let shippingAddress;
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {
    shippingAddress = {};
  }

  const buyer = order.customer?.name || order.guestName || "—";
  const email = order.customer?.email || order.guestEmail || "—";
  const mine = summarizeSellerLines(order.items);
  const orderCancelled = order.orderStatus === "cancelled";
  const primaryLine = order.items[0];
  const sellerOrderStatus = primaryLine?.sellerOrderStatus || "pending";
  const canHandover =
    !orderCancelled &&
    Boolean(order.deliveryCompanyId) &&
    ["accepted", "preparing", "ready_for_delivery"].includes(sellerOrderStatus);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/seller/orders" className="text-sm text-muted-foreground hover:text-foreground">
            ← Orders
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight">{order.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()} · {buyer} · {email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            Payment: {order.paymentStatus}
          </Badge>
          <Badge variant="secondary">
            {formatOrderStatus(order.orderStatus)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Your line items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="min-w-[240px] lg:min-w-[280px]">Your fulfillment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.name}</div>
                        {line.product ? (
                          <Link
                            href={`/products/${line.product.slug}`}
                            className="text-xs text-primary hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on storefront
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">${line.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">${line.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="align-top">
                        <SellerOrderLineFulfillment
                          itemId={line.id}
                          initialDeliveryStatus={line.deliveryStatus}
                          initialTrackingId={line.trackingId}
                          orderCancelled={orderCancelled}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Order timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ul className="space-y-3">
                  {order.statusHistory.map((h) => (
                    <li key={h.id} className="border-l-2 border-primary/30 pl-4 text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold capitalize">{h.status}</span>
                        <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                      {h.comment ? <p className="mt-1 text-muted-foreground">{h.comment}</p> : null}
                      {h.createdBy ? <p className="text-xs text-muted-foreground">By {h.createdBy}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SellerOrderActions
            orderId={order.id}
            sellerOrderStatus={sellerOrderStatus}
            canHandover={canHandover}
          />
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Your totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line subtotal</span>
                <span className="tabular-nums">${mine.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (est.)</span>
                <span className="tabular-nums">${mine.commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Your earning (est.)</span>
                <span className="tabular-nums">${mine.sellerEarning.toFixed(2)}</span>
              </div>
              <p className="pt-3 text-xs text-muted-foreground">
                Full order total (all sellers): <span className="font-medium text-foreground">${order.total.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Method: <span className="capitalize">{order.paymentMethod}</span>
                {order.trackingId ? (
                  <>
                    <br />
                    Tracking: <span className="font-mono">{order.trackingId}</span>
                  </>
                ) : null}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Deliver to</CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p>{shippingAddress.address}</p>
              <p>
                {shippingAddress.city}
                {shippingAddress.state ? `, ${shippingAddress.state}` : ""} {shippingAddress.zipCode || ""}
              </p>
              <p>{shippingAddress.country}</p>
              <p className="mt-2">{shippingAddress.phone}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
