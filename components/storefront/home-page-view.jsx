import Link from "next/link";
import { Truck, ShieldCheck, HeadphonesIcon, Store, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { RecentlyViewedRail } from "@/components/storefront/recently-viewed-rail";
import { AutoCarousel } from "@/components/shared/auto-carousel";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/brand";
import { resolveMediaUrl } from "@/lib/upload-url";
import { StorefrontHeroBackdrop } from "@/components/storefront/storefront-hero-backdrop";

/**
 * @param {{
 *   heroBanners: { id: string; title: string; image: string; link: string | null }[];
 *   categories: { id: string; name: string; slug: string; image: string | null }[];
 *   featuredProducts: Record<string, unknown>[];
 *   trendingProducts: Record<string, unknown>[];
 *   newArrivals: Record<string, unknown>[];
 *   brands: { id: string; name: string; slug: string; logo: string | null }[];
 *   sellers: { id: string; shopName: string | null; shopSlug: string; shopLogo: string | null; shopBanner: string | null; productCount: number }[];
 *   sponsoredAds?: { id: string; title: string; image: string | null; link: string; shopName?: string | null; placement: string }[];
 * }} props
 */
export function HomePageView({
  heroBanners,
  sponsoredAds = [],
  categories,
  featuredProducts,
  trendingProducts,
  newArrivals,
  brands,
  sellers,
}) {
  const primary = heroBanners[0];
  const restBanners = heroBanners.slice(1);

  return (
    <div className="relative overflow-hidden">
      {/* Hero with background banner + admin promo banners */}
      <StorefrontHeroBackdrop tall>
        <div className="mb-8 max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[#FFBF00]/40 bg-[#FFBF00]/15 px-3 py-1 text-xs font-semibold text-[#FFBF00] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {SITE_NAME} marketplace
          </p>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            Everything you love, from sellers you trust
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
            Curated categories, featured picks, and independent shops — one checkout, clear pricing, mobile-first
            browsing.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="min-h-11 border-0 bg-[#FFBF00] px-6 font-semibold text-[#002395] shadow-lg shadow-black/20 hover:bg-[#FFBF00]/90"
              asChild
            >
              <Link href="/products">Shop all products</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-h-11 border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>

        {primary ? (
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6 lg:items-stretch">
            <Link
              href={primary.link || "/products"}
              className="group relative flex min-h-[200px] overflow-hidden rounded-2xl border border-white/20 bg-black/20 shadow-xl ring-1 ring-white/10 transition hover:shadow-2xl lg:col-span-7 lg:min-h-[280px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(primary.image)}
                alt={primary.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001a6e]/90 via-[#002395]/40 to-transparent" />
              <div className="relative mt-auto flex w-full flex-col justify-end p-5 sm:p-7 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#FFBF00]">Featured</p>
                <p className="mt-1 max-w-lg text-2xl font-bold leading-tight text-white sm:text-3xl">{primary.title}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white/90">
                  Shop the collection
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:grid-rows-2 lg:gap-6">
              {(restBanners.length ? restBanners : []).map((b) => (
                <Link
                  key={b.id}
                  href={b.link || "/products"}
                  className="group relative flex min-h-[140px] overflow-hidden rounded-2xl border border-white/20 bg-black/20 shadow-lg ring-1 ring-white/10 transition hover:shadow-xl sm:min-h-[160px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveMediaUrl(b.image)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#001a6e]/85 to-transparent" />
                  <div className="relative flex h-full flex-col justify-center p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white sm:text-base">{b.title}</p>
                    <span className="mt-1 text-xs text-[#FFBF00]">Explore →</span>
                  </div>
                </Link>
              ))}
              {restBanners.length === 0 ? (
                <div className="flex min-h-[140px] flex-col justify-center rounded-2xl border border-dashed border-white/30 bg-white/10 p-5 backdrop-blur-sm sm:min-h-[160px] lg:flex-1">
                  <p className="text-sm font-medium text-white">Deals &amp; drops</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/75">
                    Promotional banners from your admin panel appear here beside the main hero.
                  </p>
                  <Button
                    className="mt-4 w-fit border-0 bg-[#FFBF00] text-[#002395] hover:bg-[#FFBF00]/90"
                    size="sm"
                    asChild
                  >
                    <Link href="/products">Browse catalog</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </StorefrontHeroBackdrop>

      {sponsoredAds.length > 0 ? (
        <section className="border-b border-border/60 bg-muted/20 py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sponsored</p>
                <h2 className="text-xl font-bold tracking-tight">Promoted on Markay Hall</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/stores">Find stores</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsoredAds.slice(0, 6).map((ad) => (
                <Link
                  key={ad.id}
                  href={ad.link}
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
                >
                  {ad.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(ad.image)} alt={ad.title} className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-muted text-sm text-muted-foreground">{ad.title}</div>
                  )}
                  <div className="p-4">
                    <p className="font-semibold">{ad.title}</p>
                    {ad.shopName ? <p className="text-xs text-muted-foreground">{ad.shopName}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Trending products — auto-sliding carousel */}
      {trendingProducts.length > 0 ? (
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.06] via-background to-muted/30 py-12 md:py-16">
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <AutoCarousel
              eyebrow="Trending"
              title="Hot right now"
              subtitle="Best-selling picks — tap a product image to browse photos, tap again to view details."
              autoPlayInterval={4000}
              action={
                <Button variant="outline" className="border-primary/25 bg-background/80" asChild>
                  <Link href="/products?sort=sold" className="inline-flex items-center gap-1">
                    Shop trending
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              }
            >
              {trendingProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </AutoCarousel>
          </div>
        </section>
      ) : null}

      {/* Trust strip */}
      <section className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ul className="grid gap-6 sm:grid-cols-3 sm:gap-10">
            {[
              {
                Icon: Truck,
                title: "Fast delivery",
                body: "Free delivery on qualifying orders — calculated at checkout.",
              },
              {
                Icon: ShieldCheck,
                title: "Secure checkout",
                body: "Encrypted payments with trusted providers and clear order tracking.",
              },
              {
                Icon: HeadphonesIcon,
                title: "Seller support",
                body: "Multivendor marketplace — buy from many shops in one basket.",
              },
            ].map(({ Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-4 rounded-xl border border-border/60 bg-background/60 p-4 shadow-sm sm:flex-col sm:items-center sm:text-center sm:shadow-none sm:ring-0 md:flex-row md:items-start md:text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 sm:max-w-xs md:max-w-none">
                  <p className="font-semibold leading-none">{title}</p>
                  <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-14 md:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Categories</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Shop by department</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Jump straight into what you need — every category stays aligned with your catalog.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 border-primary/20" asChild>
              <Link href="/products" className="inline-flex items-center gap-2">
                View all products
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No categories yet. Add them in the admin catalog.
            </p>
          ) : (
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-sm ring-1 ring-black/5 transition hover:border-primary/35 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full bg-muted">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(c.image)}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-2xl font-bold text-primary/40">
                          {c.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{c.name}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                        Shop now <ArrowRight className="h-3 w-3" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 ? (
        <section className="border-y border-border/60 bg-muted/25 py-12 md:py-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Brands</p>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">Shop by brand</h2>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start md:gap-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/products?brand=${encodeURIComponent(b.slug)}`}
                  className="flex h-14 min-w-[7.5rem] items-center justify-center rounded-xl border border-border/80 bg-background px-4 py-2 shadow-sm transition hover:border-primary/30 hover:shadow md:h-16 md:min-w-[8.5rem]"
                >
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(b.logo)} alt={b.name} className="max-h-9 max-w-[100px] object-contain grayscale transition hover:grayscale-0 md:max-h-10" />
                  ) : (
                    <span className="text-center text-xs font-semibold leading-tight text-foreground md:text-sm">{b.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured */}
      <section className="py-14 md:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Featured</p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Staff picks</h2>
            <p className="text-sm text-muted-foreground md:text-base">Highlighted products from your catalog.</p>
          </div>
          {featuredProducts.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Mark products as featured in admin to fill this grid.
            </p>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {featuredProducts.map((p) => (
                <li key={p.id} className="min-w-0">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* New arrivals — horizontal on small screens */}
      {newArrivals.length > 0 ? (
        <section className="border-t border-border/60 bg-muted/20 py-14 md:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Just in</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">New arrivals</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fresh listings from the catalog.</p>
              </div>
              <Button variant="ghost" className="self-start text-primary hover:text-primary sm:self-auto" asChild>
                <Link href="/products" className="inline-flex items-center gap-1">
                  See all
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {newArrivals.map((p) => (
                <div key={p.id} className="w-[min(280px,78vw)] shrink-0 snap-start sm:w-auto sm:min-w-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Sellers — auto-sliding carousel */}
      {sellers.length > 0 ? (
        <section className="relative overflow-hidden py-14 md:py-16 lg:py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            aria-hidden
          />
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <AutoCarousel
              eyebrow="Marketplace"
              title="Meet our sellers"
              subtitle={`Independent shops on ${SITE_NAME} — auto-scrolling storefronts you can visit anytime.`}
              autoPlayInterval={5000}
              itemClassName="w-[min(300px,82vw)] sm:w-[min(320px,45vw)] lg:w-[min(300px,28vw)]"
            >
              {sellers.map((s) => (
                <Link
                  key={s.id}
                  href={`/shop/${s.shopSlug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="relative h-32 w-full bg-muted md:h-36">
                    {s.shopBanner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(s.shopBanner)}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-accent/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute -bottom-8 left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-lg ring-2 ring-primary/20">
                      {s.shopLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveMediaUrl(s.shopLogo)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-7 w-7 text-primary" aria-hidden />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-11">
                    <p className="text-lg font-bold leading-tight">{s.shopName || s.shopSlug}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {s.productCount} product{s.productCount === 1 ? "" : "s"} in catalog
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                      Visit shop
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </AutoCarousel>
          </div>
        </section>
      ) : null}

      {/* Recently viewed */}
      <section className="border-t border-border/60 py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <RecentlyViewedRail title="Recently viewed" />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-gradient-to-br from-primary/12 via-background to-muted/40 py-14 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Sell on ShopLIB</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
            Open your shop, list products, and reach customers — seller dashboard and payouts included.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="min-h-11 bg-accent px-8 text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/seller/register">Become a seller</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-h-11 bg-background/80" asChild>
              <Link href="/seller/login">Seller login</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
