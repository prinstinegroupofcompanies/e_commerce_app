"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductDeactivateButton } from "@/components/product/product-deactivate-button";

const ACTIONS = [
  { value: "activate", label: "Activate" },
  { value: "deactivate", label: "Deactivate" },
  { value: "feature", label: "Mark featured" },
  { value: "unfeature", label: "Unmark featured" },
  { value: "delete", label: "Delete (soft)" },
];

/**
 * @param {{ products: Array<{
 *   id: string;
 *   name: string;
 *   slug: string;
 *   price: number;
 *   stockQuantity: number;
 *   isActive: boolean;
 *   isFeatured: boolean;
 *   seller: { shopName: string | null } | null;
 * }> }} props
 */
export function AdminProductsList({ products }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set());
  const [action, setAction] = useState("activate");
  const [working, setWorking] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.seller?.shopName || "").toLowerCase().includes(q),
    );
  }, [products, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggle(id, on) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllVisible(on) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) {
        if (on) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  async function runBulk() {
    if (selected.size === 0) {
      toast.error("Select at least one product");
      return;
    }
    if (action === "delete" && !window.confirm(`Soft-delete ${selected.size} product(s)? They will be hidden from the storefront.`)) {
      return;
    }
    setWorking(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Bulk action failed");
      } else {
        toast.success(`${json.data?.updated || 0} product(s) updated`);
        setSelected(new Set());
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setWorking(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, deactivate, or bulk update catalog items.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
        <input
          type="search"
          placeholder="Search by name, slug or seller…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.size} selected
          </span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" onClick={runBulk} disabled={working || selected.size === 0}>
            {working ? "Applying…" : "Apply"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all visible"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No products match.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} data-selected={selected.has(p.id) ? "true" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.has(p.id)}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </TableCell>
                  <TableCell>{p.seller?.shopName ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.stockQuantity}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {p.isFeatured ? <Badge>Featured</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/products/${p.slug}`} target="_blank" rel="noreferrer">
                          View
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                      </Button>
                      {p.isActive ? <ProductDeactivateButton productId={p.id} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
