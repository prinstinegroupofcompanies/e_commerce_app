import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/json";
import {
  catalogProductVisibilityWhere,
  parseProductListParams,
  productListOrderBy,
} from "@/lib/storefront-catalog";
import { ShopPageView } from "@/components/storefront/shop-page-view";
import { SITE_NAME } from "@/lib/brand";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const seller = await prisma.seller.findFirst({
    where: {
      shopSlug: params.slug,
      verificationStatus: "approved",
      isShopActive: true,
      isActive: true,
    },
    select: { shopName: true, name: true, shopDescription: true },
  });
  if (!seller) return { title: "Shop not found" };
  const name = seller.shopName || seller.name;
  return {
    title: `${name} · ${SITE_NAME}`,
    description: seller.shopDescription || `Shop ${name} on ${SITE_NAME}`,
  };
}

export default async function ShopPage({ params, searchParams }) {
  const seller = await prisma.seller.findFirst({
    where: {
      shopSlug: params.slug,
      verificationStatus: "approved",
      isShopActive: true,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      shopName: true,
      shopSlug: true,
      shopDescription: true,
      shopLogo: true,
      shopBanner: true,
      shopCity: true,
      shopCountry: true,
      totalOrders: true,
    },
  });
  if (!seller) notFound();

  const p = parseProductListParams(searchParams || {});
  const orderBy = productListOrderBy(p);
  const tab = searchParams?.tab === "reviews" ? "reviews" : "products";
  const viewMode = searchParams?.view === "list" ? "list" : "grid";

  const productWhere = {
    sellerId: seller.id,
    ...catalogProductVisibilityWhere(),
  };

  const sellerProductIds = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { id: true },
  });
  const productIds = sellerProductIds.map((x) => x.id);

  const [rows, reviewAgg, reviews] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy,
      take: 48,
      include: { seller: { select: { shopName: true, shopSlug: true } } },
    }),
    productIds.length > 0
      ? prisma.review.aggregate({
          where: { productId: { in: productIds }, isApproved: true },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : Promise.resolve({ _avg: { rating: null }, _count: { _all: 0 } }),
    productIds.length > 0
      ? prisma.review.findMany({
          where: { productId: { in: productIds }, isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 24,
          include: {
            product: { select: { name: true, slug: true } },
            customer: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const products = rows.map((row) => ({ ...row, images: parseStringArray(row.images) }));

  const reviewStats = {
    average: reviewAgg._avg.rating ?? 0,
    count: reviewAgg._count._all,
  };

  const reviewItems = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    customerName: r.customer?.name || "Customer",
    productName: r.product.name,
    productSlug: r.product.slug,
  }));

  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-muted-foreground">Loading shop…</p>}>
      <ShopPageView
        seller={seller}
        products={products}
        reviewStats={reviewStats}
        reviews={reviewItems}
        activeTab={tab}
        viewMode={viewMode}
      />
    </Suspense>
  );
}
