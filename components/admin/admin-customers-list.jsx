import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function AdminCustomersList() {
  await auth();

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      walletBalance: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, code: true, createdAt: true, total: true, orderStatus: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registered storefront accounts and quick order context.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Latest order</TableHead>
              <TableHead className="text-right">Behavior</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                const last = c.orders[0];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px] truncate text-sm">{c.email}</div>
                      {c.phone ? (
                        <div className="max-w-[220px] truncate text-xs text-muted-foreground">{c.phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c._count.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">${c.walletBalance.toFixed(2)}</TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {last ? (
                        <div className="inline-block text-left">
                          <Link
                            href={`/admin/orders/${last.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {last.code}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {new Date(last.createdAt).toLocaleDateString()} ·{" "}
                            <span className="capitalize">{last.orderStatus}</span> · ${last.total.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/analytics/customers/${c.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
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
