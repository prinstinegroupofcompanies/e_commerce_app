import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Transactions" };

export default async function AdminTransactionsPage() {
  await auth();
  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">Payment and refund ledger entries.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No transactions yet.
                </TableCell>
              </TableRow>
            ) : (
              txns.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">{t.type}</TableCell>
                  <TableCell className="capitalize">{t.method}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-mono text-xs">{t.reference || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">${t.amount.toFixed(2)}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{t.status}</Badge>
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
