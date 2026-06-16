"use client";

import Link from "next/link";
import { ShoppingBag, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AccountMenu } from "@/components/storefront/account-menu";
import { StorefrontSearchBar } from "@/components/storefront/storefront-search-bar";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";

export function StorefrontHeader() {
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl flex-wrap items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" type="button" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <BrandLogo href="/" size="md" priority className="min-w-0 shrink-0 bg-transparent" />
        <nav className="hidden flex-1 items-center gap-6 px-2 text-sm font-medium lg:flex">
          <Link href="/products" className="text-muted-foreground transition hover:text-primary">
            Products
          </Link>
          <Link href="/stores" className="text-muted-foreground transition hover:text-primary">
            Stores
          </Link>
          <Link href="/blog" className="text-muted-foreground transition hover:text-primary">
            Blog
          </Link>
        </nav>
        <div className="order-last w-full md:order-none md:mx-2 md:max-w-lg md:flex-1">
          <StorefrontSearchBar />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AccountMenu />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="relative"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </header>
  );
}
