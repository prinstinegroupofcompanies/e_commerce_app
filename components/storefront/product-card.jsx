"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProductCardMedia } from "@/components/storefront/product-card-media";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { CompareToggle } from "@/components/storefront/compare-toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackInteraction } from "@/lib/analytics/track-client";

/**
 * @param {{
 *   product: {
 *     id: string;
 *     slug: string;
 *     name: string;
 *     price: number;
 *     comparePrice?: number | null;
 *     thumbnail?: string | null;
 *     images?: string | string[] | null;
 *     averageRating: number;
 *     totalReviews: number;
 *     sellerId?: string | null;
 *     seller?: { shopName?: string | null; shopSlug?: string | null } | null;
 *     type?: string;
 *   };
 *   layout?: "grid" | "list";
 * }} props
 */
export function ProductCard({ product, layout = "grid" }) {
  const isVariable = product.type === "variable";
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const mounted = useClientMounted();
  const storeWishlisted = useWishlistStore((s) => s.has(product.id));
  const wishlisted = mounted && storeWishlisted;
  const sellerName = product.seller?.shopName || product.seller?.shopSlug || "Marketplace seller";

  function handleAdd(e) {
    e.preventDefault();
    if (isVariable) return;
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.thumbnail || "/placeholder-product.svg",
      sellerId: product.sellerId,
    });
    toast.success("Added to cart");
    trackInteraction({
      eventType: "add_to_cart",
      productId: product.id,
      sellerId: product.sellerId ?? null,
      path: `/products/${product.slug}`,
    });
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    const next = !useWishlistStore.getState().has(product.id);
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      thumbnail: product.thumbnail || "/placeholder-product.svg",
      price: product.price,
    });
    toast.success(next ? "Saved to wishlist" : "Removed from wishlist");
    if (next) {
      trackInteraction({
        eventType: "wishlist_add",
        productId: product.id,
        sellerId: product.sellerId ?? null,
        path: `/products/${product.slug}`,
      });
    }
  }

  if (layout === "list") {
    return (
      <Card className="group overflow-hidden rounded-2xl border-border/80 shadow-sm ring-1 ring-black/5 transition duration-300 hover:border-primary/30 hover:shadow-lg">
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="relative w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
            <ProductCardMedia
              slug={product.slug}
              name={product.name}
              thumbnail={product.thumbnail}
              images={product.images}
              className="rounded-xl"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{sellerName}</p>
              <Link href={`/products/${product.slug}`}>
                <h3 className="mt-1 text-lg font-semibold leading-snug transition hover:text-primary">{product.name}</h3>
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
                {product.comparePrice && product.comparePrice > product.price ? (
                  <span className="text-muted-foreground line-through">${product.comparePrice.toFixed(2)}</span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{product.averageRating?.toFixed(1) ?? "0.0"}</span>
                <span className="text-muted-foreground">({product.totalReviews})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleWishlist}>
                <Heart className={cn("mr-1 h-4 w-4", wishlisted && "fill-current text-red-500")} />
                {wishlisted ? "Saved" : "Wishlist"}
              </Button>
              <CompareToggle productId={product.id} productName={product.name} size="md" />
              {isVariable ? (
                <Button size="sm" asChild>
                  <Link href={`/products/${product.slug}`}>Choose options</Link>
                </Button>
              ) : (
                <Button size="sm" type="button" onClick={handleAdd}>
                  Add to cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/80 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
      <div className="relative">
        <ProductCardMedia
          slug={product.slug}
          name={product.name}
          thumbnail={product.thumbnail}
          images={product.images}
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full border-0 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-current text-red-500")} />
        </Button>
      </div>
      <CardContent className="space-y-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{sellerName}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-semibold leading-snug transition hover:text-primary">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.comparePrice && product.comparePrice > product.price ? (
            <span className="text-sm text-muted-foreground line-through">${product.comparePrice.toFixed(2)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-medium">{product.averageRating?.toFixed(1) ?? "0.0"}</span>
          <span className="text-muted-foreground">({product.totalReviews} reviews)</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-2 p-4 pt-0">
        {isVariable ? (
          <Button className="flex-1 shadow-sm" asChild>
            <Link href={`/products/${product.slug}`}>Choose options</Link>
          </Button>
        ) : (
          <Button className="flex-1 shadow-sm" type="button" onClick={handleAdd}>
            Add to cart
          </Button>
        )}
        <CompareToggle productId={product.id} productName={product.name} />
      </CardFooter>
    </Card>
  );
}
