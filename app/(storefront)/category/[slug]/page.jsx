import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";
import { parseStringArray } from "@/lib/json";
import { mergeProductListFilters, parseProductListParams, productListOrderBy } from "@/lib/storefront-catalog";
import { ProductFiltersSidebar } from "@/components/storefront/product-filters-sidebar";
import { ProductPagination } from "@/components/storefront/product-pagination";
import { ProductListControls } from "@/components/storefront/product-list-controls";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }) {
  const cat = await prisma.category.findFirst({
    where: { slug: params.slug, isActive: true },
  });
  if (!cat) notFound();

  const p = parseProductListParams(searchParams || {});
  const where = mergeProductListFilters({}, p, { lockedCategoryId: cat.id });
  const orderBy = productListOrderBy(p);

  const [total, rows, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.perPage,
      take: p.perPage,
      include: { seller: { select: { shopName: true, shopSlug: true } } },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  const products = rows.map((row) => ({ ...row, images: parseStringArray(row.images) }));
  const basePath = `/category/${params.slug}`;

  const q = {
    brand: p.brandSlug || undefined,
    sort: p.sort !== "newest" ? p.sort : undefined,
    view: p.view === "list" ? "list" : undefined,
    minPrice: searchParams?.minPrice ? String(searchParams.minPrice) : undefined,
    maxPrice: searchParams?.maxPrice ? String(searchParams.maxPrice) : undefined,
    minRating: searchParams?.minRating ? String(searchParams.minRating) : undefined,
  };

  const paginationQuery = { ...q };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{cat.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {total} products in this category
      </p>

      <div className="mt-6">
        <Suspense fallback={<div className="h-9" aria-hidden />}>
          <ProductListControls defaultSort="newest" />
        </Suspense>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <ProductFiltersSidebar basePath={basePath} categories={[]} brands={brands} q={q} mode="category" />
        <div>
          {products.length === 0 ? (
            <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              No products in this category for your filters.
            </p>
          ) : (
            <div
              className={cn(
                p.view === "list" ? "flex flex-col gap-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} layout={p.view === "list" ? "list" : "grid"} />
              ))}
            </div>
          )}
          <ProductPagination page={p.page} perPage={p.perPage} total={total} basePath={basePath} query={paginationQuery} />
        </div>
      </div>
    </div>
  );
}
