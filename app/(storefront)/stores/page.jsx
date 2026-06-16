"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Store, MapPin, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/upload-url";

/**
 * @typedef {{
 *   id: string;
 *   shopName: string | null;
 *   shopSlug: string;
 *   shopLogo: string | null;
 *   shopBanner: string | null;
 *   shopDescription: string | null;
 *   shopCity: string | null;
 *   shopCounty: string | null;
 *   businessCategory: string | null;
 *   totalOrders: number;
 *   _count: { products: number };
 * }} StoreRow
 */

export default function StoresPage() {
  const [q, setQ] = useState("");
  const [stores, setStores] = useState(/** @type {StoreRow[]} */ ([]));
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStores = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "48" });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/stores?${params}`);
      const json = await res.json();
      if (json.success) {
        setStores(json.data || []);
        setTotal(json.meta?.total ?? json.data?.length ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores("");
  }, [loadStores]);

  function handleSearch(e) {
    e.preventDefault();
    loadStores(q);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All stores</h1>
        <p className="mt-2 text-muted-foreground">
          Browse verified Markay Hall businesses — click a store to view products and details.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by name, city, county, or category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Search"}
        </Button>
        {q ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              loadStores("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading stores…" : `${total} store${total === 1 ? "" : "s"} available`}
      </p>

      {!loading && stores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <Store className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No stores found{q ? " for your search" : ""}.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Link key={s.id} href={`/shop/${s.shopSlug}`} className="group block">
              <Card className="h-full overflow-hidden transition hover:border-primary/40 hover:shadow-md">
                <div className="relative h-28 bg-muted">
                  {s.shopBanner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(s.shopBanner)}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/10" />
                  )}
                  <div className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-4 border-card bg-card shadow">
                    {s.shopLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(s.shopLogo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
                <CardContent className="space-y-2 pb-5 pt-9">
                  <h2 className="font-semibold leading-tight group-hover:text-primary">
                    {s.shopName || s.shopSlug}
                  </h2>
                  {s.shopDescription ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{s.shopDescription}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(s.shopCity || s.shopCounty) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[s.shopCity, s.shopCounty].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {s._count?.products ?? 0} products
                    </span>
                  </div>
                  {s.businessCategory ? (
                    <p className="text-xs font-medium text-primary/80">{s.businessCategory}</p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
