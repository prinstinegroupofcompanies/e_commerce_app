import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Wallet" };

export default async function SellerWalletPage() {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const [seller, payouts] = await Promise.all([
    prisma.seller.findUnique({
      where: { id: sellerId },
      select: { walletBalance: true, totalEarnings: true },
    }),
    prisma.payout.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Earnings balance and payout history.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Wallet balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-primary">
              ${(seller?.walletBalance ?? 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total earnings (all time)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">${(seller?.totalEarnings ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payouts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No payouts yet.
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${p.amount.toFixed(2)}</TableCell>
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
