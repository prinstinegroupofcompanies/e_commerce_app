import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { CancelOrderButton } from "@/components/customer/cancel-order-button";
import { ConfirmDeliveryForm } from "@/components/customer/confirm-delivery-form";
import { OrderLiveTracking } from "@/components/customer/order-live-tracking";
import { formatOrderStatus } from "@/lib/order-labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const session = await auth();
  const customerId = session?.user?.id;
  const { id } = params;
  if (!customerId) return { title: "Order" };
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    select: { code: true },
  });
  return { title: order ? `Order ${order.code}` : "Order" };
}

export default async function CustomerOrderDetailPage({ params }) {
  const session = await auth();
  const customerId = session?.user?.id;
  if (!customerId) redirect("/login");

  const { id } = params;

  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, name: true } },
          seller: { select: { shopName: true, shopSlug: true } },
        },
      },
      statusHistory: { orderBy: { createdAt: "desc" } },
      pickupPoint: {
        select: { name: true, address: true, city: true, country: true, phone: true, hours: true },
      },
      deliveryCompany: { select: { name: true } },
      deliveryAssignments: {
        include: { rider: { select: { name: true, phone: true, currentLat: true, currentLng: true } } },
      },
    },
  });

  if (!order) notFound();

  let shippingAddress;
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {
    shippingAddress = {};
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">
            ← My orders
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight">{order.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            Payment: {order.paymentStatus}
          </Badge>
          <Badge variant="secondary">
            {formatOrderStatus(order.orderStatus)}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/orders/${order.id}/invoice`}>
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
          {["pending", "accepted"].includes(order.orderStatus) && order.paymentStatus !== "paid" ? (
            <CancelOrderButton orderId={order.id} />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Delivery</TableHead>
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
                          >
                            View product
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {line.seller?.shopName || line.seller?.shopSlug || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">${line.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">${line.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="capitalize">
                          {line.deliveryStatus}
                        </Badge>
                        {line.trackingId ? (
                          <p className="mt-1 max-w-[180px] break-all font-mono text-xs text-muted-foreground">
                            {line.trackingId}
                          </p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {order.statusHistory.map((h) => (
                    <li key={h.id} className="border-l-2 border-primary/30 pl-4 text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold capitalize">{h.status}</span>
                        <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                      {h.comment ? <p className="mt-1 text-muted-foreground">{h.comment}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!order.isPickup && order.orderStatus !== "delivered" ? (
            <Card>
              <CardHeader className="border-b bg-muted/40 py-4">
                <CardTitle className="text-base">Confirm delivery</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {order.deliveryOtp && !order.deliveryOtpVerifiedAt ? (
                  <p className="mb-3 text-sm text-muted-foreground">
                    Your delivery PIN: <span className="font-mono font-semibold text-foreground">{order.deliveryOtp}</span>
                  </p>
                ) : null}
                <ConfirmDeliveryForm orderId={order.id} alreadyConfirmed={Boolean(order.deliveryOtpVerifiedAt)} />
              </CardContent>
            </Card>
          ) : null}
          {order.deliveryCompany ? (
            <Card>
              <CardHeader className="border-b bg-muted/40 py-4">
                <CardTitle className="text-base">Delivery partner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 text-sm">
                <p className="font-medium">{order.deliveryCompany.name}</p>
                <OrderLiveTracking
                  orderId={order.id}
                  initialAssignments={order.deliveryAssignments.map((a) => ({
                    id: a.id,
                    status: a.status,
                    riderLat: a.riderLat ?? a.rider?.currentLat,
                    riderLng: a.riderLng ?? a.rider?.currentLng,
                    etaMinutes: a.etaMinutes,
                    rider: a.rider,
                  }))}
                />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="tabular-nums">${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">${order.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${order.total.toFixed(2)}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
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
              <CardTitle className="text-base">
                {order.isPickup ? "Pickup details" : "Delivery address"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              {order.isPickup ? (
                <>
                  {order.pickupPoint ? (
                    <>
                      <p className="mt-2 font-medium text-foreground">{order.pickupPoint.name}</p>
                      <p>{order.pickupPoint.address}</p>
                      <p>
                        {order.pickupPoint.city}, {order.pickupPoint.country}
                      </p>
                      {order.pickupPoint.hours ? <p>Hours: {order.pickupPoint.hours}</p> : null}
                      {order.pickupPoint.phone ? <p>Phone: {order.pickupPoint.phone}</p> : null}
                    </>
                  ) : shippingAddress.pickupPointName ? (
                    <>
                      <p className="mt-2 font-medium text-foreground">{shippingAddress.pickupPointName}</p>
                      <p>{shippingAddress.pickupAddress || shippingAddress.address}</p>
                    </>
                  ) : null}
                  <p className="mt-2">Contact: {shippingAddress.phone}</p>
                </>
              ) : (
                <>
                  <p>{shippingAddress.address}</p>
                  <p>
                    {shippingAddress.city}
                    {shippingAddress.state ? `, ${shippingAddress.state}` : ""}{" "}
                    {shippingAddress.zipCode || ""}
                  </p>
                  <p>{shippingAddress.country}</p>
                  <p className="mt-2">{shippingAddress.phone}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
