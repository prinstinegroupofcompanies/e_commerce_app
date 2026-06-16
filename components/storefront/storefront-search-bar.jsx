"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Store, Package, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { resolveMediaUrl } from "@/lib/upload-url";
import { cn } from "@/lib/utils";

/**
 * Live search for products and stores with clickable results.
 */
export function StorefrontSearchBar({ className, inputClassName, placeholder = "Search products and stores…" }) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ products: [], stores: [] });
  const debounced = useDebounce(q.trim(), 280);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setResults({ products: [], stores: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/search/unified?q=${encodeURIComponent(debounced)}&limit=6`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setResults({
            products: json.data?.products || [],
            stores: json.data?.stores || [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setResults({ products: [], stores: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const hasResults = results.products.length > 0 || results.stores.length > 0;
  const showPanel = open && debounced.length >= 2;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-expanded={showPanel}
          aria-controls={listId}
          className={cn(
            "h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inputClassName
          )}
        />
        {loading ? (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="submit"
            className="absolute right-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Go
          </button>
        )}
      </form>

      {showPanel ? (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border bg-popover p-2 shadow-xl"
        >
          {!loading && !hasResults ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No products or stores found.</p>
          ) : null}

          {results.stores.length > 0 ? (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stores</p>
              <ul className="space-y-1">
                {results.stores.map((store) => (
                  <li key={store.id}>
                    <Link
                      href={`/shop/${store.shopSlug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {store.shopLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(store.shopLogo)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{store.shopName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[store.shopCity, store.shopCounty].filter(Boolean).join(" · ") ||
                            `${store._count?.products ?? 0} products`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {results.products.length > 0 ? (
            <div>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
              <ul className="space-y-1">
                {results.products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveMediaUrl(product.thumbnail) || "/placeholder-product.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          ${product.price?.toFixed(2)}
                          {product.seller?.shopName ? ` · ${product.seller.shopName}` : ""}
                        </p>
                      </div>
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {debounced.length >= 2 ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(debounced)}`);
              }}
              className="mt-2 w-full rounded-lg border border-dashed py-2 text-center text-sm font-medium text-primary hover:bg-primary/5"
            >
              View all results for “{debounced}”
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
