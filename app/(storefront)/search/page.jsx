import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";
import { parseStringArray } from "@/lib/json";
import { mergeProductListFilters, parseProductListParams, productListOrderBy } from "@/lib/storefront-catalog";
import { dbContains } from "@/lib/db-contains";
import { resolveMediaUrl } from "@/lib/upload-url";
import { Store } from "lucide-react";
import { SITE_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const p = parseProductListParams({ ...searchParams, q: undefined });
  const orderBy = productListOrderBy(p);

  const storeWhere = q
    ? {
        verificationStatus: "approved",
        isShopActive: true,
        isActive: true,
        OR: [
          { shopName: dbContains(q) },
          { shopDescription: dbContains(q) },
          { shopCity: dbContains(q) },
          { shopCounty: dbContains(q) },
          { businessCategory: dbContains(q) },
          { name: dbContains(q) },
        ],
      }
    : null;

  const productWhere = q
    ? mergeProductListFilters(
        {
          OR: [
            { name: dbContains(q) },
            { shortDescription: dbContains(q) },
            { slug: dbContains(q) },
            { brand: { isActive: true, name: dbContains(q) } },
            { category: { isActive: true, name: dbContains(q) } },
            { seller: { shopName: dbContains(q) } },
          ],
        },
        p
      )
    : null;

  const [stores, products] = await Promise.all([
    storeWhere
      ? prisma.seller.findMany({
          where: storeWhere,
          orderBy: { totalOrders: "desc" },
          take: 24,
          select: {
            id: true,
            shopName: true,
            shopSlug: true,
            shopLogo: true,
            shopDescription: true,
            shopCity: true,
            shopCounty: true,
            businessCategory: true,
            _count: { select: { products: { where: { isActive: true } } } },
          },
        })
      : [],
    productWhere
      ? prisma.product.findMany({
          where: productWhere,
          orderBy,
          take: 36,
          include: { seller: { select: { shopName: true, shopSlug: true } } },
        })
      : [],
  ]);

  const rows = products.map((pr) => ({ ...pr, images: parseStringArray(pr.images) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {q ? `Results for “${q}” across ${SITE_NAME}` : "Use the search bar to find products and stores."}
      </p>

      {q && stores.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Stores ({stores.length})</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/shop/${store.shopSlug}`}
                className="flex gap-4 rounded-xl border bg-card p-4 transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {store.shopLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(store.shopLogo)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{store.shopName}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {store.shopDescription || store.businessCategory || "Verified seller on Markay Hall"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[store.shopCity, store.shopCounty].filter(Boolean).join(" · ")} · {store._count.products}{" "}
                    products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {q && rows.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Products ({rows.length})</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((pr) => (
              <ProductCard key={pr.id} product={pr} />
            ))}
          </div>
        </section>
      ) : null}

      {q && stores.length === 0 && rows.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No products or stores found. Try a different keyword or{" "}
          <Link href="/products" className="text-primary hover:underline">
            browse all products
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
