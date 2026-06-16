import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Package, Star, ShoppingBag, Store } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { ShopProductControls } from "@/components/storefront/shop-product-controls";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/brand";
import { resolveMediaUrl } from "@/lib/upload-url";

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="text-amber-500" aria-label={`${rating.toFixed(1)} out of 5`}>
      {"★".repeat(full)}
      <span className="text-muted-foreground/30">{"★".repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

/**
 * @param {{
 *   seller: {
 *     shopName: string | null;
 *     name: string;
 *     shopSlug: string | null;
 *     shopDescription: string | null;
 *     shopLogo: string | null;
 *     shopBanner: string | null;
 *     shopCity: string | null;
 *     shopCountry: string | null;
 *     totalOrders: number;
 *   };
 *   products: Record<string, unknown>[];
 *   reviewStats: { average: number; count: number };
 *   reviews: Array<{
 *     id: string;
 *     rating: number;
 *     title: string | null;
 *     body: string | null;
 *     createdAt: string;
 *     customerName: string;
 *     productName: string;
 *     productSlug: string;
 *   }>;
 *   activeTab: "products" | "reviews";
 *   viewMode: "grid" | "list";
 * }} props
 */
export function ShopPageView({ seller, products, reviewStats, reviews, activeTab, viewMode }) {
  const displayName = seller.shopName || seller.name;
  const location = [seller.shopCity, seller.shopCountry].filter(Boolean).join(", ");

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative border-b border-primary/10">
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/40 sm:h-52 md:h-64">
          {seller.shopBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(seller.shopBanner)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-card shadow-lg sm:h-28 sm:w-28">
              {seller.shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(seller.shopLogo)} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Seller on {SITE_NAME}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
              {seller.shopSlug ? (
                <p className="mt-1 text-sm text-muted-foreground">@{seller.shopSlug}</p>
              ) : null}
              {location ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {location}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-primary/10 bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
          <Stat icon={Package} label="Products" value={String(products.length)} />
          <Stat
            icon={Star}
            label="Rating"
            value={reviewStats.count > 0 ? reviewStats.average.toFixed(1) : "—"}
            sub={reviewStats.count > 0 ? `${reviewStats.count} reviews` : "No reviews yet"}
          />
          <Stat icon={ShoppingBag} label="Orders" value={String(seller.totalOrders ?? 0)} />
          <Stat icon={Store} label="Member since" value="Verified seller" sub="Trusted shop" />
        </div>
      </section>

      {/* Description */}
      {seller.shopDescription ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{seller.shopDescription}</p>
        </section>
      ) : null}

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ShopProductControls productCount={products.length} />
        </Suspense>

        <div className="mt-8">
          {activeTab === "reviews" ? (
            <ReviewsSection reviews={reviews} reviewStats={reviewStats} />
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary/20 bg-card p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No products listed yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon for new items from this shop.</p>
              <Link href="/products" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Browse all products
              </Link>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              )}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} layout={viewMode} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex flex-col items-center justify-center bg-background px-4 py-5 text-center">
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function ReviewsSection({ reviews, reviewStats }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-card p-12 text-center">
        <Star className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to leave a review after purchasing from this shop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-card px-4 py-3">
        <Stars rating={reviewStats.average} />
        <span className="text-lg font-bold">{reviewStats.average.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">based on {reviewStats.count} reviews</span>
      </div>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-primary/10 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Stars rating={r.rating} />
                {r.title ? <p className="mt-2 font-semibold">{r.title}</p> : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.customerName} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/products/${r.productSlug}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                {r.productName}
              </Link>
            </div>
            {r.body ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
