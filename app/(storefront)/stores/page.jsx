"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/upload-url";

export default function StoresSearchPage() {
  const [q, setQ] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/stores?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      setStores(json.success ? json.data : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find stores</h1>
        <p className="mt-2 text-muted-foreground">Browse verified Markay Hall businesses across Liberia.</p>
      </div>
      <form onSubmit={search} className="flex gap-2">
        <Input
          placeholder="Search by store name, city, county, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {stores.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex gap-4 p-5">
              {s.shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(s.shopLogo)} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-lg font-bold">
                  {(s.shopName || "?")[0]}
                </div>
              )}
              <div>
                <Link href={`/shop/${s.shopSlug}`} className="font-semibold hover:text-primary">
                  {s.shopName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[s.shopCity, s.shopCounty].filter(Boolean).join(", ")}
                  {s.businessCategory ? ` · ${s.businessCategory}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s._count?.products ?? 0} products · {s.totalOrders} orders
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && stores.length === 0 && q ? (
        <p className="text-center text-sm text-muted-foreground">No stores found.</p>
      ) : null}
    </div>
  );
}
