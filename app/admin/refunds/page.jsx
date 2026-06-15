import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminRefundActions } from "@/components/admin/admin-refund-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Refunds" };

export default async function AdminRefundsPage() {
  await auth();
  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      order: { select: { id: true, code: true } },
      customer: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
        <p className="text-sm text-muted-foreground">Review and process customer refund requests.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No refund requests.
                </TableCell>
              </TableRow>
            ) : (
              refunds.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${r.order.id}`} className="font-mono text-sm text-primary hover:underline">
                      {r.order.code}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.customer?.name || "—"}
                    <div className="text-xs text-muted-foreground">{r.customer?.email}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${r.amount.toFixed(2)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.reason || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AdminRefundActions refundId={r.id} status={r.status} />
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
