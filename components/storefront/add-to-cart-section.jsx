"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

/**
 * @param {{ id: string, sku?: string | null, options: string, price: number, comparePrice?: number | null, stock: number, image?: string | null, isActive: boolean }} v
 */
function variantLabel(v) {
  try {
    const o = JSON.parse(v.options || "{}");
    if (o && typeof o === "object") {
      return Object.entries(o)
        .map(([k, val]) => `${k}: ${val}`)
        .join(" · ");
    }
  } catch {
    /* ignore */
  }
  return v.sku || "Variant";
}

/**
 * @param {{
 *   product: {
 *     id: string;
 *     name: string;
 *     slug: string;
 *     price: number;
 *     thumbnail?: string | null;
 *     sellerId?: string | null;
 *     stockQuantity: number;
 *     minPurchaseQty?: number;
 *     maxPurchaseQty?: number | null;
 *   };
 *   variants?: { id: string; sku?: string | null; options: string; price: number; comparePrice?: number | null; stock: number; image?: string | null; isActive: boolean }[];
 * }} props
 */
export function AddToCartSection({ product, variants = [] }) {
  const addItem = useCartStore((s) => s.addItem);
  const hasVariants = variants.length > 0;
  const activeVariants = useMemo(() => variants.filter((v) => v.isActive !== false && v.stock > 0), [variants]);
  const minQ = Math.max(1, product.minPurchaseQty ?? 1);

  const [selectedId, setSelectedId] = useState(() => activeVariants[0]?.id ?? "");
  const selected = useMemo(
    () => activeVariants.find((v) => v.id === selectedId) ?? activeVariants[0],
    [activeVariants, selectedId]
  );

  const maxCap = product.maxPurchaseQty != null ? Math.max(minQ, product.maxPurchaseQty) : null;
  const stockCap = hasVariants ? (selected?.stock ?? 0) : product.stockQuantity;
  const outOfStock = hasVariants ? activeVariants.length === 0 : product.stockQuantity <= 0;

  const maxQ = maxCap != null ? Math.min(maxCap, stockCap) : stockCap;
  const price = hasVariants ? (selected?.price ?? product.price) : product.price;

  const [qty, setQty] = useState(minQ);

  useEffect(() => {
    if (!hasVariants) return;
    if (activeVariants.length === 0) {
      setSelectedId("");
      return;
    }
    if (!activeVariants.some((v) => v.id === selectedId)) {
      setSelectedId(activeVariants[0].id);
      setQty(minQ);
    }
  }, [hasVariants, activeVariants, selectedId, minQ]);

  function clampQty(n) {
    if (!Number.isFinite(n) || n < minQ) return minQ;
    if (maxQ > 0 && n > maxQ) return maxQ;
    return Math.floor(n);
  }

  function addToCart() {
    if (outOfStock) return;
    const q = clampQty(qty);
    if (hasVariants && selected) {
      addItem({
        productId: product.id,
        variantId: selected.id,
        name: `${product.name} (${variantLabel(selected)})`,
        price: selected.price,
        quantity: q,
        image: selected.image || product.thumbnail,
        sellerId: product.sellerId,
      });
    } else {
      addItem({
        productId: product.id,
        variantId: null,
        name: product.name,
        price: product.price,
        quantity: q,
        image: product.thumbnail,
        sellerId: product.sellerId,
      });
    }
    toast.success("Added to cart");
  }

  return (
    <div className="mt-8 space-y-4">
      {hasVariants && activeVariants.length === 0 ? (
        <p className="text-sm text-destructive">All options are currently out of stock.</p>
      ) : hasVariants ? (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="variant">
            Option
          </label>
          <select
            id="variant"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={selected?.id ?? ""}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setQty(minQ);
            }}
          >
            {activeVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {variantLabel(v)} — ${v.price.toFixed(2)} ({v.stock} in stock)
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex max-w-xs items-end gap-3">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="qty">
            Quantity
          </label>
          <Input
            id="qty"
            type="number"
            min={minQ}
            max={maxQ > 0 ? maxQ : undefined}
            value={qty}
            onChange={(e) => setQty(clampQty(Number(e.target.value)))}
            disabled={outOfStock}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={outOfStock} type="button" onClick={addToCart}>
          Add to cart · ${price.toFixed(2)}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="/checkout">Buy now</a>
        </Button>
      </div>
    </div>
  );
}
