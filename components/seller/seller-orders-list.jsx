import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sellerOrdersWhere, summarizeSellerLines } from "@/lib/seller-orders";

export async function SellerOrdersList() {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const orders = await prisma.order.findMany({
    where: sellerOrdersWhere(sellerId),
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      customer: { select: { name: true, email: true } },
      items: {
        where: { sellerId },
        select: { quantity: true, subtotal: true, commission: true, sellerEarning: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders that include your products. Amounts reflect your line items only.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Your items</TableHead>
              <TableHead className="text-right">Your sales</TableHead>
              <TableHead className="text-right">Est. payout</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const buyer = o.customer?.name || o.guestName || "—";
                const email = o.customer?.email || o.guestEmail || "—";
                const { quantity, subtotal, sellerEarning } = summarizeSellerLines(o.items);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link href={`/seller/orders/${o.id}`} className="text-primary hover:underline">
                        {o.code}
                      </Link>
                      <div className="text-xs font-normal text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">{buyer}</div>
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground">{email}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{quantity}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">${sellerEarning.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {o.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/seller/orders/${o.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
