import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Wallet" };

export default async function CustomerWalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [customer, transactions] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true, name: true },
    }),
    prisma.walletTransaction.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const balance = customer?.walletBalance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Store credit and transaction history.</p>
      </div>

      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Available balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums text-primary">${balance.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.description || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">${t.balance.toFixed(2)}</TableCell>
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
