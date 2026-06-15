"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Best rating" },
  { value: "sold", label: "Best selling" },
];

/**
 * @param {{ defaultSort?: string }} props
 */
export function ProductListControls({ defaultSort = "newest" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const qs = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const pushParams = useCallback(
    (mutate) => {
      const next = new URLSearchParams(qs.toString());
      mutate(next);
      startTransition(() => {
        const s = next.toString();
        router.push(s ? `${pathname}?${s}` : pathname);
      });
    },
    [pathname, qs, router]
  );

  const sortValue = searchParams.get("sort") || defaultSort;
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort</span>
        <select
          className={cn("h-9 rounded-md border border-input bg-background px-2 text-sm", pending && "opacity-60")}
          value={sortValue}
          onChange={(e) => {
            const v = e.target.value;
            pushParams((n) => {
              if (!v || v === "newest") n.delete("sort");
              else n.set("sort", v);
              n.delete("page");
            });
          }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-1 rounded-md border p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2", viewMode === "grid" && "bg-muted")}
          onClick={() =>
            pushParams((n) => {
              n.delete("view");
              n.delete("page");
            })
          }
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2", viewMode === "list" && "bg-muted")}
          onClick={() =>
            pushParams((n) => {
              n.set("view", "list");
              n.delete("page");
            })
          }
          aria-label="List view"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
