import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/json";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { HomePageView } from "@/components/storefront/home-page-view";
import { SITE_NAME } from "@/lib/brand";
import { getActiveStoreAdvertisements } from "@/lib/store-ads";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Home",
    description: "Discover products from trusted sellers on ShopLIB.",
  };
}

/** @param {import("@prisma/client").Product & { images: unknown; seller?: unknown }} p */
function mapProductForHome(p) {
  return {
    ...p,
    images: parseStringArray(p.images),
  };
}

export default async function HomePage() {
  const visible = catalogProductVisibilityWhere();

  const [banners, sponsoredAds, featured, trending, newArrivals, categories, brands, sellers] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true, position: "homepage" },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    getActiveStoreAdvertisements(),
    prisma.product.findMany({
      where: { ...visible, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        seller: { select: { shopName: true, shopSlug: true } },
      },
    }),
    prisma.product.findMany({
      where: visible,
      orderBy: { totalSold: "desc" },
      take: 12,
      include: {
        seller: { select: { shopName: true, shopSlug: true } },
      },
    }),
    prisma.product.findMany({
      where: visible,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        seller: { select: { shopName: true, shopSlug: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 14,
    }),
    prisma.seller.findMany({
      where: {
        isActive: true,
        isShopActive: true,
        verificationStatus: "approved",
        shopSlug: { not: null },
      },
      orderBy: { totalOrders: "desc" },
      take: 16,
      select: {
        id: true,
        shopName: true,
        shopSlug: true,
        shopLogo: true,
        shopBanner: true,
        _count: { select: { products: true } },
      },
    }),
  ]);

  const heroBanners = (banners.length
    ? banners
    : [{ id: "fallback", title: `Welcome to ${SITE_NAME}`, image: "/placeholder-banner.svg", link: "/products" }]
  ).map((b) => ({
    id: b.id,
    title: b.title,
    image: b.image,
    link: b.link ?? null,
  }));

  const sellerRows = sellers.map((s) => ({
    id: s.id,
    shopName: s.shopName,
    shopSlug: s.shopSlug,
    shopLogo: s.shopLogo,
    shopBanner: s.shopBanner,
    productCount: s._count.products,
  }));

  const sponsored = sponsoredAds.map((a) => ({
    id: a.id,
    title: a.title,
    image: a.image,
    link: a.link || (a.seller?.shopSlug ? `/shop/${a.seller.shopSlug}` : "/products"),
    shopName: a.seller?.shopName,
    placement: a.placement,
  }));

  return (
    <HomePageView
      heroBanners={heroBanners}
      sponsoredAds={sponsored}
      categories={categories}
      featuredProducts={featured.map(mapProductForHome)}
      trendingProducts={trending.map(mapProductForHome)}
      newArrivals={newArrivals.map(mapProductForHome)}
      brands={brands}
      sellers={sellerRows}
    />
  );
}
