import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminMobileMoneyConfirm } from "@/components/admin/admin-mobile-money-confirm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Platform wallet" };

export default async function AdminWalletPage() {
  await auth();

  const [grossRevenue, commissionEarning, sellerPayout, recentTransactions, pendingPayouts] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "paid" }, _sum: { total: true } }),
    prisma.orderItem.aggregate({ _sum: { commission: true } }),
    prisma.orderItem.aggregate({ _sum: { sellerEarning: true } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.payout.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 10, include: { seller: { select: { name: true, shopName: true } } } }),
  ]);

  const stats = [
    { label: "Gross revenue (paid)", value: `$${(grossRevenue._sum.total ?? 0).toFixed(2)}` },
    { label: "Platform commission", value: `$${(commissionEarning._sum.commission ?? 0).toFixed(2)}` },
    { label: "Owed to sellers", value: `$${(sellerPayout._sum.sellerEarning ?? 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform wallet</h1>
        <p className="text-sm text-muted-foreground">Revenue, commissions, and payout flow.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold">Mobile money confirmations</h2>
        <p className="text-sm text-muted-foreground">
          Confirm Orange Money / MTN payments until provider webhooks are connected.
        </p>
        <AdminMobileMoneyConfirm />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <CardTitle className="text-base">Pending payouts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No pending payouts.
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.seller.shopName || p.seller.name}</TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No transactions recorded.
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{t.type}</TableCell>
                    <TableCell className="capitalize">{t.method}</TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">{t.reference || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">${t.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{t.status}</Badge>
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
