"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * @param {{ products: { id: string; name: string; slug: string; price: number; stockQuantity: number; isActive: boolean; isFeatured: boolean; seller?: { shopName: string | null } | null }[] }} props
 */
export function AdminProductsTable({ products }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set());
  const [pending, setPending] = useState(false);

  const allChecked = products.length > 0 && selected.size === products.length;
  const anyChecked = selected.size > 0;

  const ids = useMemo(() => products.map((p) => p.id), [products]);

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(ids));
  }

  async function runBulk(action, confirmMsg) {
    if (selected.size === 0) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Bulk action failed");
      toast.success(`${action} applied to ${json.data?.count ?? selected.size} products`);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Bulk action failed");
    }
    setPending(false);
  }

  return (
    <div className="space-y-3">
      {anyChecked ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("activate")}>
              Activate
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("deactivate")}>
              Deactivate
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("feature")}>
              Feature
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("unfeature")}>
              Unfeature
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => runBulk("delete", "Deactivate (soft delete) these products?")}
            >
              Soft delete
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
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
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className={selected.has(p.id) ? "bg-primary/5" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 rounded border-input"
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
                    <div className="flex flex-wrap items-center gap-1">
                      {p.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {p.isFeatured ? <Badge className="bg-accent text-accent-foreground">Featured</Badge> : null}
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
