"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Best rating" },
  { value: "sold", label: "Best selling" },
];

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      {label}
    </button>
  );
}

/**
 * @param {{ defaultSort?: string; productCount: number }} props
 */
export function ShopProductControls({ defaultSort = "newest", productCount }) {
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
    [pathname, qs, router],
  );

  const sortValue = searchParams.get("sort") || defaultSort;
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const tab = searchParams.get("tab") === "reviews" ? "reviews" : "products";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TabButton
          active={tab === "products"}
          onClick={() =>
            pushParams((p) => {
              p.delete("tab");
            })
          }
          label={`Products (${productCount})`}
        />
        <TabButton
          active={tab === "reviews"}
          onClick={() =>
            pushParams((p) => {
              p.set("tab", "reviews");
            })
          }
          label="Reviews"
        />
      </div>
      {tab === "products" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select
              className={cn(
                "h-9 rounded-md border border-input bg-background px-2 text-sm",
                pending && "opacity-60",
              )}
              value={sortValue}
              onChange={(e) => {
                pushParams((p) => {
                  if (e.target.value === "newest") p.delete("sort");
                  else p.set("sort", e.target.value);
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
          <div className="flex rounded-md border border-input p-0.5">
            <button
              type="button"
              aria-label="Grid view"
              className={cn(
                "rounded p-1.5",
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
              onClick={() =>
                pushParams((p) => {
                  p.delete("view");
                })
              }
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              className={cn(
                "rounded p-1.5",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
              onClick={() =>
                pushParams((p) => {
                  p.set("view", "list");
                })
              }
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
