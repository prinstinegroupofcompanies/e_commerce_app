"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CartGuestReminder } from "@/components/storefront/cart-guest-reminder";
import { resolveMediaUrl } from "@/lib/upload-url";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discount = useCartStore((s) => s.getDiscount());
  const total = useCartStore((s) => s.getTotal());
  const coupon = useCartStore((s) => s.coupon);
  const couponMeta = useCartStore((s) => s.couponMeta);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [couponInput, setCouponInput] = useState(coupon ?? "");
  const [applying, setApplying] = useState(false);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse products and add something you love.</p>
        <Button className="mt-6" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">Shopping cart</h1>
        {items.map((line) => (
          <Card key={`${line.productId}-${line.variantId ?? "x"}`}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(line.image) || "/placeholder-product.svg"}
                alt=""
                className="h-24 w-24 rounded-md border object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{line.name}</p>
                <p className="text-sm text-muted-foreground">${line.price.toFixed(2)} each</p>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground" htmlFor={`qty-${line.productId}`}>
                    Qty
                  </label>
                  <input
                    id={`qty-${line.productId}`}
                    type="number"
                    min={1}
                    className="h-9 w-20 rounded-md border bg-background px-2 text-sm"
                    value={line.quantity}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      updateQuantity(line.productId, line.variantId, Math.max(1, n));
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(line.price * line.quantity).toFixed(2)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive"
                  type="button"
                  onClick={() => removeItem(line.productId, line.variantId)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" type="button" onClick={() => clearCart()}>
          Clear cart
        </Button>
      </div>
      <div>
        <Card className="sticky top-24">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Summary</h2>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>{couponMeta?.title ?? "Discount"}</span>
                <span>−${discount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Estimated total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="space-y-2 border-t pt-4">
              <label className="text-sm font-medium" htmlFor="coupon">
                Coupon code
              </label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code"
                  disabled={applying}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={applying}
                  onClick={async () => {
                    setApplying(true);
                    const r = await applyCoupon(couponInput);
                    setApplying(false);
                    if (r.ok) {
                      const c = useCartStore.getState().coupon;
                      toast.success(c ? "Coupon applied" : "Coupon cleared");
                    } else toast.error(r.error ?? "Invalid coupon");
                  }}
                >
                  Apply
                </Button>
              </div>
              {coupon ? (
                <Button type="button" variant="link" className="h-auto px-0 text-sm" onClick={() => { removeCoupon(); setCouponInput(""); toast.message("Coupon removed"); }}>
                  Remove coupon
                </Button>
              ) : null}
            </div>
            <CartGuestReminder />
            <CartGuestReminder />
            <p className="text-xs text-muted-foreground">
              Delivery and taxes are estimated at checkout.
            </p>
            <Button className="w-full" asChild>
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/products">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
