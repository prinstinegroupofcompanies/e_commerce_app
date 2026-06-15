import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SellerPayoutRequest } from "@/components/seller/seller-payout-request";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payouts" };

export default async function SellerPayoutsPage() {
  const session = await auth();
  if (session?.user?.role !== "seller") redirect("/seller/login");

  const [seller, payouts, minSetting] = await Promise.all([
    prisma.seller.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true, totalEarnings: true },
    }),
    prisma.payout.findMany({ where: { sellerId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.setting.findUnique({ where: { key: "min_payout_amount" } }),
  ]);

  const minPayout = Number(minSetting?.value ?? "20");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">Withdraw your earnings and review past requests.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">${(seller?.walletBalance ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">${(seller?.totalEarnings ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <SellerPayoutRequest walletBalance={seller?.walletBalance ?? 0} minPayout={minPayout} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No payouts requested yet.
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${p.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
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
