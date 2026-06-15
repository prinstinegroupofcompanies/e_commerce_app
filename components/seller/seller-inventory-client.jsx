"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * @param {{
 *   lowSimple: { id: string; name: string; stockQuantity: number; lowStockThreshold: number }[];
 *   variantRows: {
 *     productId: string;
 *     productName: string;
 *     variantId: string;
 *     sku: string | null;
 *     options: string;
 *     price: number;
 *     stock: number;
 *     isActive: boolean;
 *     low: boolean;
 *   }[];
 * }} props
 */
export function SellerInventoryClient({ lowSimple, variantRows }) {
  const router = useRouter();
  const [saving, setSaving] = useState(null);

  async function updateStock(payload) {
    const key = payload.kind === "simple" ? payload.productId : payload.variantId;
    setSaving(key);
    try {
      const res = await fetch("/api/seller/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not update stock");
        return;
      }
      toast.success("Stock updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      {lowSimple.length > 0 ? (
        <div className="rounded-md border bg-card">
          <div className="border-b bg-muted/40 px-4 py-3">
            <h2 className="text-base font-semibold">Low stock — simple products</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right w-36">Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowSimple.map((p) => (
                <StockRowSimple key={p.id} product={p} saving={saving === p.id} onSave={updateStock} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <div className="rounded-md border bg-card">
        <div className="border-b bg-muted/40 px-4 py-3">
          <h2 className="text-base font-semibold">Variable product variants</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right w-36">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {variantRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No variable products yet. Add variants when editing a product.
                </TableCell>
              </TableRow>
            ) : (
              variantRows.map((row) => (
                <StockRowVariant key={row.variantId} row={row} saving={saving === row.variantId} onSave={updateStock} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** @param {{ product: { id: string; name: string; stockQuantity: number }; saving: boolean; onSave: (p: object) => Promise<void> }} props */
function StockRowSimple({ product, saving, onSave }) {
  const [stock, setStock] = useState(String(product.stockQuantity));

  return (
    <TableRow>
      <TableCell>
        <Link href={`/seller/products/${product.id}/edit`} className="font-medium text-primary hover:underline">
          {product.name}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          className="ml-auto h-8 w-24 text-right tabular-nums"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">{product.lowStockThreshold}</TableCell>
      <TableCell>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => onSave({ kind: "simple", productId: product.id, stock: Number(stock) })}
        >
          {saving ? "…" : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** @param {{ row: { productId: string; productName: string; variantId: string; sku: string | null; options: string; price: number; stock: number; isActive: boolean; low: boolean }; saving: boolean; onSave: (p: object) => Promise<void> }} props */
function StockRowVariant({ row, saving, onSave }) {
  const [stock, setStock] = useState(String(row.stock));

  return (
    <TableRow>
      <TableCell>
        <Link href={`/seller/products/${row.productId}/edit`} className="font-medium text-primary hover:underline">
          {row.productName}
        </Link>
      </TableCell>
      <TableCell className="text-sm">{row.options}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{row.sku || "—"}</TableCell>
      <TableCell className="text-right tabular-nums">${row.price.toFixed(2)}</TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          className="ml-auto h-8 w-24 text-right tabular-nums"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Badge variant={row.isActive ? "secondary" : "outline"}>{row.isActive ? "Active" : "Inactive"}</Badge>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => onSave({ kind: "variant", variantId: row.variantId, stock: Number(stock) })}
        >
          {saving ? "…" : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
