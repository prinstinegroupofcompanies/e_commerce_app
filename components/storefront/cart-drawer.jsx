"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";
import { CartGuestReminder } from "@/components/storefront/cart-guest-reminder";
import { resolveMediaUrl } from "@/lib/upload-url";

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discount = useCartStore((s) => s.getDiscount());
  const total = useCartStore((s) => s.getTotal());

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "Nothing here yet." : `${items.length} line${items.length === 1 ? "" : "s"}`}
          </p>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 sm:px-6">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Browse the catalog and tap add to cart.</p>
              <Button asChild>
                <Link href="/products" onClick={() => setOpen(false)}>
                  Shop products
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((line) => (
                <li
                  key={`${line.productId}-${line.variantId ?? "base"}`}
                  className="flex gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(line.image) || "/placeholder-product.svg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{line.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">${line.price.toFixed(2)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          updateQuantity(line.productId, line.variantId, Math.max(1, line.quantity - 1))
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Remove"
                        onClick={() => removeItem(line.productId, line.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                    ${(line.price * line.quantity).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <SheetFooter className="space-y-3">
            <CartGuestReminder />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon</span>
                  <span className="tabular-nums">−${discount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Estimated total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" asChild>
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/cart" onClick={() => setOpen(false)}>
                  View cart
                </Link>
              </Button>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
