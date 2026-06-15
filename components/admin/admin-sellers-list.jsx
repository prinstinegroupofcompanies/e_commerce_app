import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function AdminSellersList() {
  await auth();

  const sellers = await prisma.seller.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      name: true,
      email: true,
      shopName: true,
      shopSlug: true,
      isActive: true,
      isShopActive: true,
      commissionRate: true,
      totalEarnings: true,
      totalOrders: true,
      verifiedAt: true,
      verificationStatus: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sellers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketplace vendors, shop status, and catalog size.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No sellers yet.
                </TableCell>
              </TableRow>
            ) : (
              sellers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground">{s.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{s.shopName || "—"}</div>
                    {s.shopSlug ? (
                      <Link
                        href={`/shop/${s.shopSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        /shop/{s.shopSlug}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">No slug</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s._count.products}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.totalOrders}</TableCell>
                  <TableCell className="text-right tabular-nums">${s.totalEarnings.toFixed(2)}</TableCell>
                  <TableCell className="tabular-nums text-sm">{s.commissionRate}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {s.isShopActive ? (
                        <Badge variant="outline">Shop open</Badge>
                      ) : (
                        <Badge variant="outline">Shop closed</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {s.verificationStatus || "pending"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${s.id}`} className="text-sm text-primary hover:underline">
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
