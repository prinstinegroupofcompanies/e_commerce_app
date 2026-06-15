"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/store/compare-store";

export function CompareBar() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setItems(j?.data?.products || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!mounted || ids.length === 0) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-3xl rounded-lg border border-primary/20 bg-card/95 p-3 shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Scale className="h-4 w-4" />
          Compare ({ids.length})
        </div>
        <div className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-2">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-primary/10 bg-background px-2 py-1 text-xs"
              >
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt={p.name} className="h-7 w-7 rounded object-cover" />
                ) : null}
                <span className="max-w-[120px] truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/compare">Compare</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => clear()}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
