import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOrderStatus } from "@/lib/order-labels";

export async function CustomerOrdersList() {
  const session = await auth();
  const customerId = session?.user?.id;
  if (!customerId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track shipments and payment status for your purchases.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  You have not placed any orders yet.{" "}
                  <Link href="/products" className="text-primary hover:underline">
                    Browse products
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    <Link href={`/dashboard/orders/${o.id}`} className="text-primary hover:underline">
                      {o.code}
                    </Link>
                    <div className="text-xs font-normal text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o._count.items}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${o.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {o.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {formatOrderStatus(o.orderStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/orders/${o.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
