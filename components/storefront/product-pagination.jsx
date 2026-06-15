import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @param {{
 *   page: number;
 *   perPage: number;
 *   total: number;
 *   basePath: string;
 *   query: Record<string, string | undefined>;
 * }} props
 */
export function ProductPagination({ page, perPage, total, basePath, query }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  function hrefFor(p) {
    const o = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") o.set(k, v);
    }
    if (p > 1) o.set("page", String(p));
    else o.delete("page");
    const qs = o.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} products
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!prev} asChild={Boolean(prev)}>
          {prev ? <Link href={hrefFor(prev)}>Previous</Link> : <span>Previous</span>}
        </Button>
        <Button variant="outline" size="sm" disabled={!next} asChild={Boolean(next)}>
          {next ? <Link href={hrefFor(next)}>Next</Link> : <span>Next</span>}
        </Button>
      </div>
    </div>
  );
}
