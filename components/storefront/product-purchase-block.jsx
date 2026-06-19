"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductDetailTabs } from "@/components/storefront/product-detail-tabs";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { CompareToggle } from "@/components/storefront/compare-toggle";
import { BackInStockForm } from "@/components/storefront/back-in-stock-form";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackInteraction } from "@/lib/analytics/track-client";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import {
  parseVariantOptions,
  groupVariantAttributes,
  findVariantBySelection,
  variantLabel,
  totalVariantStock,
} from "@/lib/variant-options";

/**
 * @param {{
 *   product: {
 *     id: string;
 *     name: string;
 *     slug: string;
 *     price: number;
 *     comparePrice?: number | null;
 *     thumbnail?: string | null;
 *     sellerId?: string | null;
 *     stockQuantity: number;
 *     minPurchaseQty?: number;
 *     maxPurchaseQty?: number | null;
 *     type?: string;
 *     lowStockThreshold?: number;
 *   };
 *   galleryImages: string[];
 *   variants?: { id: string; sku?: string | null; options: string; price: number; comparePrice?: number | null; stock: number; image?: string | null; isActive: boolean }[];
 *   seller?: { shopName?: string | null; shopSlug?: string | null } | null;
 *   brand?: { name?: string | null; slug?: string | null } | null;
 *   descriptionHtml: string;
 *   reviews: { id: string; rating: number; title?: string | null; body?: string | null; createdAt: string; customerName: string }[];
 *   wishlistSaved: boolean;
 *   isLoggedIn: boolean;
 *   defaultEmail?: string;
 * }} props
 */
export function ProductPurchaseBlock({
  product,
  galleryImages,
  variants = [],
  seller,
  brand,
  descriptionHtml,
  reviews,
  wishlistSaved,
  isLoggedIn,
  defaultEmail = "",
}) {
  const addItem = useCartStore((s) => s.addItem);
  const hasVariants = product.type === "variable" && variants.length > 0;
  const activeVariants = useMemo(
    () => variants.filter((v) => v.isActive !== false),
    [variants]
  );
  const inStockVariants = useMemo(
    () => activeVariants.filter((v) => v.stock > 0),
    [activeVariants]
  );

  const attributeGroups = useMemo(
    () => groupVariantAttributes(activeVariants),
    [activeVariants]
  );
  const attributeKeys = Object.keys(attributeGroups);

  const [selection, setSelection] = useState(() => {
    const first = inStockVariants[0] || activeVariants[0];
    return first ? parseVariantOptions(first.options) : {};
  });

  const selected = useMemo(() => {
    if (!hasVariants) return null;
    const match = findVariantBySelection(activeVariants, selection);
    if (match) return match;
    return inStockVariants[0] || activeVariants[0] || null;
  }, [hasVariants, activeVariants, inStockVariants, selection]);

  const minQ = Math.max(1, product.minPurchaseQty ?? 1);
  const stockCap = hasVariants ? (selected?.stock ?? 0) : product.stockQuantity;
  const totalStock = hasVariants ? totalVariantStock(activeVariants) : product.stockQuantity;
  const outOfStock = hasVariants ? inStockVariants.length === 0 : product.stockQuantity <= 0;

  const maxCap = product.maxPurchaseQty != null ? Math.max(minQ, product.maxPurchaseQty) : null;
  const maxQ = maxCap != null ? Math.min(maxCap, stockCap) : stockCap;
  const price = hasVariants ? (selected?.price ?? product.price) : product.price;
  const comparePrice = hasVariants
    ? (selected?.comparePrice ?? product.comparePrice)
    : product.comparePrice;

  const [qty, setQty] = useState(minQ);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const displayImages = useMemo(() => {
    const base = [...galleryImages];
    if (selected?.image && !base.includes(selected.image)) {
      return [selected.image, ...base];
    }
    return base.length ? base : ["/placeholder-product.svg"];
  }, [galleryImages, selected?.image]);

  useEffect(() => {
    if (selected?.image) {
      const i = displayImages.indexOf(selected.image);
      if (i >= 0) setGalleryIdx(i);
    }
  }, [selected?.image, displayImages]);

  useEffect(() => {
    trackInteraction({
      eventType: "view_product",
      productId: product.id,
      sellerId: product.sellerId ?? null,
      path: `/products/${product.slug}`,
    });
  }, [product.id, product.slug, product.sellerId]);

  function clampQty(n) {
    if (!Number.isFinite(n) || n < minQ) return minQ;
    if (maxQ > 0 && n > maxQ) return maxQ;
    return Math.floor(n);
  }

  function selectAttribute(key, value) {
    setSelection((prev) => ({ ...prev, [key]: value }));
    setQty(minQ);
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
    trackInteraction({
      eventType: "add_to_cart",
      productId: product.id,
      sellerId: product.sellerId ?? null,
      path: `/products/${product.slug}`,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-3 shadow-xl ring-1 ring-black/5">
          <ProductImageGallery
            images={displayImages}
            productName={product.name}
            activeIndex={galleryIdx}
            onIndexChange={setGalleryIdx}
          />
        </div>
        {displayImages.length > 1 ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {displayImages.length} photos · swipe or use arrows to browse
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-lg ring-1 ring-primary/5 sm:p-8">
        <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {seller?.shopName || "Marketplace seller"}
        </p>
        <p className="sr-only">{product.name}</p>

        {brand?.name ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Brand:{" "}
            {brand.slug ? (
              <Link
                href={`/products?brand=${encodeURIComponent(brand.slug)}`}
                className="font-medium text-primary hover:underline"
              >
                {brand.name}
              </Link>
            ) : (
              brand.name
            )}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-baseline gap-3 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 to-accent/10 px-5 py-4">
          <span className="text-4xl font-bold text-primary sm:text-5xl">${price.toFixed(2)}</span>
          {comparePrice && comparePrice > price ? (
            <>
              <span className="text-lg text-muted-foreground line-through">${comparePrice.toFixed(2)}</span>
              <span className="rounded-full bg-[#FFBF00]/25 px-3 py-1 text-xs font-bold text-[#002395]">
                Save ${(comparePrice - price).toFixed(2)}
              </span>
            </>
          ) : null}
        </div>

        <p className="mt-4 text-sm">
          {!outOfStock ? (
            <span className="inline-flex items-center gap-2 font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              In stock
              {hasVariants && selected
                ? ` · ${selected.stock} for selected option`
                : ` · ${totalStock} available`}
              {!hasVariants &&
              product.lowStockThreshold > 0 &&
              product.stockQuantity <= product.lowStockThreshold ? (
                <span className="text-amber-600">· Low stock</span>
              ) : null}
            </span>
          ) : (
            <span className="font-medium text-destructive">Out of stock</span>
          )}
        </p>

        {seller?.shopSlug ? (
          <p className="mt-3">
            <Link
              href={`/shop/${seller.shopSlug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Visit seller store →
            </Link>
          </p>
        ) : null}

        <ul className="mt-6 grid gap-3 rounded-xl border border-border/60 bg-muted/25 p-4 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Fast delivery
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Secure checkout
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <RotateCcw className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Easy returns
          </li>
        </ul>

        <div className="mt-8 space-y-5">
          {hasVariants && attributeKeys.length > 0 ? (
            <div className="space-y-4">
              {attributeKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <p className="text-sm font-medium">{key}</p>
                  <div className="flex flex-wrap gap-2">
                    {attributeGroups[key].map((val) => {
                      const testSel = { ...selection, [key]: val };
                      const match = findVariantBySelection(activeVariants, testSel);
                      const available = match && match.stock > 0;
                      const isSelected = selection[key] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!match}
                          onClick={() => selectAttribute(key, val)}
                          className={cn(
                            "min-h-10 rounded-md border px-4 py-2 text-sm font-medium transition duration-200",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : available
                                ? "border-input bg-background hover:border-primary/50"
                                : "border-input bg-muted text-muted-foreground line-through opacity-60"
                          )}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
            <Button
              size="lg"
              disabled={outOfStock}
              type="button"
              onClick={addToCart}
              className="min-h-12 flex-1 bg-[#FFBF00] font-semibold text-[#002395] shadow-md hover:bg-[#FFBF00]/90 sm:flex-none sm:px-8"
            >
              Add to cart · ${price.toFixed(2)}
            </Button>
            <Button size="lg" variant="outline" className="min-h-12 border-primary/30" asChild>
              <a href="/checkout">Buy now</a>
            </Button>
          </div>
        </div>

        {outOfStock ? (
          <div className="mt-4">
            <BackInStockForm productId={product.id} defaultEmail={defaultEmail} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <WishlistButton productId={product.id} initiallySaved={wishlistSaved} isLoggedIn={isLoggedIn} />
          <CompareToggle productId={product.id} productName={product.name} size="md" />
        </div>

        <ProductDetailTabs descriptionHtml={descriptionHtml} reviews={reviews} />
      </div>
    </div>
  );
}
