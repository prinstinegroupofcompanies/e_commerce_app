"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Scale, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/store/compare-store";
import { resolveMediaUrl } from "@/lib/upload-url";

const ROWS = [
  { key: "price", label: "Price", format: (p) => `$${p.price?.toFixed(2) ?? "—"}` },
  { key: "comparePrice", label: "Compare price", format: (p) => (p.comparePrice ? `$${p.comparePrice.toFixed(2)}` : "—") },
  {
    key: "rating",
    label: "Rating",
    format: (p) =>
      p.totalReviews > 0 ? `${p.averageRating?.toFixed(1) ?? "0.0"} (${p.totalReviews})` : "No reviews yet",
  },
  { key: "totalSold", label: "Sold", format: (p) => `${p.totalSold ?? 0}` },
  {
    key: "stock",
    label: "Availability",
    format: (p) => (p.stockQuantity > 0 ? `In stock (${p.stockQuantity})` : "Out of stock"),
  },
  { key: "brand", label: "Brand", format: (p) => p.brand?.name || "—" },
  { key: "category", label: "Category", format: (p) => p.category?.name || "—" },
  { key: "seller", label: "Sold by", format: (p) => p.seller?.shopName || "Marketplace" },
  { key: "condition", label: "Condition", format: (p) => p.condition || "—" },
  { key: "shippingType", label: "Delivery", format: (p) => {
    if (p.shippingType === "free") return "Free delivery";
    if (p.shippingType === "flat") return "Flat rate";
    if (p.shippingType === "profile") return "Delivery profile";
    return p.shippingType || "—";
  }},
  { key: "cod", label: "Cash on delivery", format: (p) => (p.cashOnDelivery ? "Yes" : "No") },
  {
    key: "description",
    label: "Description",
    format: (p) => p.shortDescription || "—",
  },
];

export function CompareView() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids.join(","))}&detail=1`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setItems(j?.data?.products || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!mounted) return null;

  if (ids.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Scale className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold">No products to compare yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the catalog and tap <span className="font-medium">Compare</span> on any product to add it here.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Comparing {items.length} product{items.length === 1 ? "" : "s"}
        </p>
        <Button variant="outline" size="sm" onClick={() => clear()}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="w-44 px-4 py-3 align-top text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Feature
              </th>
              {items.map((p) => (
                <th key={p.id} className="px-4 py-3 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${p.slug}`}
                      className="flex flex-col items-center gap-2 text-center hover:opacity-90"
                    >
                      <div className="aspect-square w-24 overflow-hidden rounded-md bg-muted">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(p.thumbnail)} alt={p.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <span className="line-clamp-2 max-w-[160px] text-sm font-semibold">{p.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {p.totalReviews > 0 ? (
                    <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-current text-accent" />
                      {p.averageRating?.toFixed(1)} ({p.totalReviews})
                    </p>
                  ) : null}
                  <div className="mt-3 flex justify-center">
                    <Button asChild size="sm" className="h-8 px-3 text-xs">
                      <Link href={`/products/${p.slug}`}>View product</Link>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key} className="border-b last:border-b-0">
                <td className="bg-muted/20 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {r.label}
                </td>
                {items.map((p) => (
                  <td key={p.id} className="px-4 py-3 align-top">
                    {r.format(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
