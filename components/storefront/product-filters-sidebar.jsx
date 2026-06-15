import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * @param {Record<string, string | undefined>} merged
 */
function toQuery(merged) {
  const o = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "") continue;
    if (k === "sort" && v === "newest") continue;
    if (k === "view" && v === "grid") continue;
    if (k === "minRating" && v === "any") continue;
    o.set(k, String(v));
  }
  return o.toString();
}

/**
 * @param {{
 *   basePath: string;
 *   categories: { slug: string; name: string }[];
 *   brands: { slug: string; name: string }[];
 *   q: Record<string, string | undefined>;
 *   mode?: "all" | "category";
 * }} props
 */
export function ProductFiltersSidebar({ basePath, categories, brands, q, mode = "all" }) {
  const category = q.category || "";
  const brand = q.brand || "";
  const sort = q.sort || "";
  const view = q.view || "";
  const minPrice = q.minPrice || "";
  const maxPrice = q.maxPrice || "";
  const minRating = q.minRating || "";

  function href(partial) {
    const next = { ...q, ...partial };
    for (const k of Object.keys(next)) {
      const v = next[k];
      if (v === undefined || v === "") delete next[k];
    }
    const s = toQuery(next);
    return s ? `${basePath}?${s}` : basePath;
  }

  const chips = [];
  if (mode === "all" && category) chips.push({ label: "Category", href: href({ category: undefined }) });
  if (brand) chips.push({ label: "Brand", href: href({ brand: undefined }) });
  if (minPrice) chips.push({ label: `Min $${minPrice}`, href: href({ minPrice: undefined }) });
  if (maxPrice) chips.push({ label: `Max $${maxPrice}`, href: href({ maxPrice: undefined }) });
  if (minRating && minRating !== "any") chips.push({ label: `${minRating}+ ★`, href: href({ minRating: undefined }) });

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      <div>
        <h2 className="text-sm font-semibold">Filters</h2>
        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <Button key={c.label} variant="secondary" size="sm" className="h-7 rounded-full px-2 text-xs" asChild>
                <Link href={c.href}>
                  {c.label} ×
                </Link>
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href={basePath}>Clear all</Link>
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Refine by category, brand, price, or rating.</p>
        )}
      </div>

      {mode === "all" ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</h3>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={href({ category: c.slug === category ? undefined : c.slug })}
                  className={c.slug === category ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brands</h3>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={href({ brand: b.slug === brand ? undefined : b.slug })}
                className={b.slug === brand ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <form action={basePath} method="get" className="space-y-3">
        {mode === "all" && category ? <input type="hidden" name="category" value={category} /> : null}
        {brand ? <input type="hidden" name="brand" value={brand} /> : null}
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        {view ? <input type="hidden" name="view" value={view} /> : null}
        {minRating ? <input type="hidden" name="minRating" value={minRating} /> : null}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minPrice" className="text-xs">
                Min
              </Label>
              <Input id="minPrice" name="minPrice" type="number" min="0" step="0.01" defaultValue={minPrice} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs">
                Max
              </Label>
              <Input id="maxPrice" name="maxPrice" type="number" min="0" step="0.01" defaultValue={maxPrice} placeholder="999" />
            </div>
          </div>
          <Button type="submit" size="sm" className="mt-2 w-full">
            Apply price
          </Button>
        </div>
      </form>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { v: undefined, l: "Any" },
            { v: "4", l: "4+" },
            { v: "3", l: "3+" },
          ].map((r) => (
            <Badge
              key={r.l}
              variant={(!minRating && !r.v) || minRating === r.v ? "default" : "outline"}
              asChild
            >
              <Link href={href({ minRating: r.v })}>{r.l}</Link>
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}
