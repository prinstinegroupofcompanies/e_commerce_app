import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SellerInventoryClient } from "@/components/seller/seller-inventory-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Variant inventory" };

export default async function SellerInventoryPage() {
  const session = await auth();
  const sellerId = session?.user?.id;

  const products = await prisma.product.findMany({
    where: { sellerId, type: "variable" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      lowStockThreshold: true,
      variants: {
        orderBy: { stock: "asc" },
        select: {
          id: true,
          sku: true,
          options: true,
          price: true,
          stock: true,
          isActive: true,
        },
      },
    },
  });

  const simpleProducts = await prisma.product.findMany({
    where: { sellerId, type: "simple", isActive: true },
    orderBy: { stockQuantity: "asc" },
    take: 50,
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      lowStockThreshold: true,
    },
  });

  const lowSimple = simpleProducts.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  const variantRows = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productName: p.name,
      variantId: v.id,
      sku: v.sku,
      options: v.options,
      price: v.price,
      stock: v.stock,
      isActive: v.isActive,
      low: v.stock <= p.lowStockThreshold,
    })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Variant inventory</h1>
          <p className="text-sm text-muted-foreground">
            Update stock inline for simple and variable products. Changes save per row.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/seller/products">Manage products</Link>
        </Button>
      </div>

      <SellerInventoryClient lowSimple={lowSimple} variantRows={variantRows} />
    </div>
  );
}
