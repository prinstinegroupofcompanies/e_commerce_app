"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/upload-url";

const KEY = "shoplib_recent_products";

/**
 * @param {{ excludeId?: string; limit?: number; title?: string }} props
 */
export function RecentlyViewedRail({ excludeId, limit = 8, title = "Recently viewed" }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      const ids = (Array.isArray(raw) ? raw : [])
        .map((p) => p?.id)
        .filter((id) => id && id !== excludeId)
        .slice(0, limit);

      if (ids.length === 0) {
        setLoaded(true);
        return;
      }

      fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          setItems(j?.data?.products || []);
          setLoaded(true);
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
    } catch {
      setLoaded(true);
    }
    return () => {
      cancelled = true;
    };
  }, [excludeId, limit]);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">{items.length} items</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group block overflow-hidden rounded-lg border border-primary/10 bg-card transition hover:border-primary/30 hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(p.thumbnail)}
                  alt={p.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-medium leading-snug">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-primary">${p.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
