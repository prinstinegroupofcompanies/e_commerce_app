"use client";

import { useEffect } from "react";

const KEY = "shoplib_recent_products";

/**
 * @param {{ id: string; slug: string; name: string; thumbnail?: string | null; price: number }} product
 */
export function RecentlyViewedTracker({ product }) {
  useEffect(() => {
    try {
      const prev = JSON.parse(typeof window !== "undefined" ? localStorage.getItem(KEY) || "[]" : "[]");
      const list = Array.isArray(prev) ? prev : [];
      const next = [
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          thumbnail: product.thumbnail,
          price: product.price,
        },
      ]
        .concat(list.filter((p) => p && p.id !== product.id))
        .slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [product]);

  return null;
}
