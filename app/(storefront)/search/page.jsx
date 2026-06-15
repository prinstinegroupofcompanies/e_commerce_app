import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";
import { parseStringArray } from "@/lib/json";
import { mergeProductListFilters, parseProductListParams, productListOrderBy } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  return { title: q ? `Search: ${q} · ShopLIB` : "Search · ShopLIB" };
}

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const p = parseProductListParams({ ...searchParams, q: undefined });
  const orderBy = productListOrderBy(p);

  const where = q
    ? mergeProductListFilters(
        {
          OR: [
            { name: { contains: q } },
            { shortDescription: { contains: q } },
            { slug: { contains: q } },
            { brand: { isActive: true, name: { contains: q } } },
            { category: { isActive: true, name: { contains: q } } },
          ],
        },
        p
      )
    : null;

  const products = where
    ? await prisma.product.findMany({
        where,
        orderBy,
        take: 36,
        include: { seller: { select: { shopName: true, shopSlug: true } } },
      })
    : [];

  const rows = products.map((pr) => ({ ...pr, images: parseStringArray(pr.images) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {q ? `Results for “${q}”` : "Enter a query in the header search box."}
      </p>

      {q && rows.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((pr) => (
            <ProductCard key={pr.id} product={pr} />
          ))}
        </div>
      ) : null}

      {q && rows.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No products found. Try a different keyword or{" "}
          <Link href="/products" className="text-primary hover:underline">
            browse all products
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
