import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/json";
import { auth } from "@/lib/auth";
import { ProductPurchaseBlock } from "@/components/storefront/product-purchase-block";
import { ProductReviewForm } from "@/components/storefront/product-review-form";
import { RecentlyViewedTracker } from "@/components/storefront/recently-viewed-tracker";
import { RecentlyViewedRail } from "@/components/storefront/recently-viewed-rail";
import { ProductCard } from "@/components/storefront/product-card";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { totalVariantStock } from "@/lib/variant-options";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const product = await prisma.product.findFirst({
    where: {
      slug: params.slug,
      isActive: true,
      AND: [
        { OR: [{ categoryId: null }, { category: { isActive: true } }] },
        { OR: [{ brandId: null }, { brand: { isActive: true } }] },
      ],
    },
    select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true, price: true },
  });
  if (!product) return { title: "Not found" };
  return {
    title: product.metaTitle || `${product.name} · ShopLIB`,
    description: product.metaDescription || product.shortDescription || undefined,
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await prisma.product.findFirst({
    where: {
      slug: params.slug,
      isActive: true,
      AND: [
        { OR: [{ categoryId: null }, { category: { isActive: true } }] },
        { OR: [{ brandId: null }, { brand: { isActive: true } }] },
      ],
    },
    include: {
      seller: { select: { shopName: true, shopSlug: true, id: true } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      variants: { where: { isActive: true }, orderBy: { id: "asc" } },
    },
  });

  if (!product) notFound();

  const images = parseStringArray(product.images);
  const gallery = [...new Set([product.thumbnail, ...images].filter(Boolean))];

  const session = await auth();
  const customerId = session?.user?.role === "customer" ? session.user.id : null;

  const [reviews, related, hasOrdered, wishlistEntry] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, isApproved: true },
      take: 24,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: {
        AND: [
          catalogProductVisibilityWhere(),
          { id: { not: product.id } },
          ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
        ],
      },
      take: 8,
      orderBy: { totalSold: "desc" },
      include: { seller: { select: { shopName: true, shopSlug: true } } },
    }),
    customerId
      ? prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: { customerId, paymentStatus: { in: ["paid", "refunded"] } },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    customerId
      ? prisma.wishlist.findUnique({
          where: { customerId_productId: { customerId, productId: product.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const reviewProps = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    customerName: r.customer?.name || "Customer",
  }));

  const descriptionHtml = product.description || `<p>${product.shortDescription || ""}</p>`;

  const effectiveStock =
    product.type === "variable" && product.variants.length
      ? totalVariantStock(product.variants)
      : product.stockQuantity;

  const site = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery.map((u) => (u.startsWith("http") ? u : `${site}${u}`)),
    description: product.shortDescription || product.name,
    sku: product.sku || undefined,
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${site}/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability:
        effectiveStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
          }
        : undefined,
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.07] via-accent/[0.03] to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <RecentlyViewedTracker
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          thumbnail: product.thumbnail,
          price: product.price,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-8 flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="rounded-md px-1 transition hover:text-primary">
          Home
        </Link>
        <span className="text-border">/</span>
        <Link href="/products" className="rounded-md px-1 transition hover:text-primary">
          Products
        </Link>
        {product.category?.slug ? (
          <>
            <span className="text-border">/</span>
            <Link href={`/category/${product.category.slug}`} className="rounded-md px-1 transition hover:text-primary">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span className="text-border">/</span>
        <span className="line-clamp-1 font-medium text-foreground">{product.name}</span>
      </nav>

      <ProductPurchaseBlock
        product={product}
        galleryImages={gallery}
        variants={product.variants}
        seller={product.seller}
        brand={product.brand}
        descriptionHtml={descriptionHtml}
        reviews={reviewProps}
        wishlistSaved={Boolean(wishlistEntry)}
        isLoggedIn={Boolean(customerId)}
        defaultEmail={session?.user?.email || ""}
      />

      <div className="mt-12 rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h2 className="text-lg font-semibold">Write a review</h2>
        <div className="mt-4 max-w-2xl">
          <ProductReviewForm
            productId={product.id}
            isLoggedIn={Boolean(customerId)}
            canReview={Boolean(hasOrdered)}
          />
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recommended</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">You may also like</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((rp) => (
              <ProductCard key={rp.id} product={{ ...rp, images: parseStringArray(rp.images) }} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 rounded-2xl border border-border/80 bg-muted/20 p-6 sm:p-8">
        <RecentlyViewedRail excludeId={product.id} title="Recently viewed" />
      </section>
      </div>
    </div>
  );
}
