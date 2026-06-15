import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSellerVerify } from "@/components/admin/admin-seller-verify";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = params;
  const seller = await prisma.seller.findFirst({
    where: { id },
    select: { shopName: true, name: true },
  });
  return { title: seller ? seller.shopName || seller.name : "Seller" };
}

export default async function AdminSellerDetailPage({ params }) {
  await auth();
  const { id } = params;

  const seller = await prisma.seller.findFirst({
    where: { id },
    include: {
      products: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stockQuantity: true,
          isActive: true,
        },
      },
      _count: { select: { products: true, orderItems: true } },
    },
  });

  if (!seller) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/sellers" className="text-sm text-muted-foreground hover:text-foreground">
            ← Sellers
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{seller.shopName || seller.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seller.name} · {seller.email}
            {seller.phone ? ` · ${seller.phone}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {seller.isActive ? (
            <Badge variant="secondary">Account active</Badge>
          ) : (
            <Badge variant="outline">Account inactive</Badge>
          )}
          {seller.isShopActive ? (
            <Badge variant="outline">Shop open</Badge>
          ) : (
            <Badge variant="outline">Shop closed</Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {seller.verificationStatus || "pending"}
          </Badge>
        </div>
        <AdminSellerVerify sellerId={seller.id} verificationStatus={seller.verificationStatus || "pending"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Recent products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seller.products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No products listed.
                      </TableCell>
                    </TableRow>
                  ) : (
                    seller.products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/products/${p.slug}`} className="font-medium text-primary hover:underline">
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">${p.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.stockQuantity}</TableCell>
                        <TableCell>
                          {p.isActive ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Shop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm">
              {seller.shopSlug ? (
                <p>
                  <span className="text-muted-foreground">Storefront: </span>
                  <Link href={`/shop/${seller.shopSlug}`} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                    /shop/{seller.shopSlug}
                  </Link>
                </p>
              ) : null}
              {seller.shopDescription ? (
                <p className="text-muted-foreground leading-relaxed">{seller.shopDescription}</p>
              ) : null}
              {(seller.shopCity || seller.shopCountry) && (
                <p className="text-muted-foreground">
                  {[seller.shopCity, seller.shopCountry].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Joined {new Date(seller.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="tabular-nums font-medium">{seller._count.products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line items sold</span>
                <span className="tabular-nums font-medium">{seller._count.orderItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders (seller stat)</span>
                <span className="tabular-nums font-medium">{seller.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission rate</span>
                <span className="tabular-nums font-medium">{seller.commissionRate}%</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Total earnings</span>
                <span className="tabular-nums font-semibold">${seller.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet balance</span>
                <span className="tabular-nums">${seller.walletBalance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
