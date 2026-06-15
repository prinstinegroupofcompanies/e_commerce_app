"use client";

import Link from "next/link";
import { ShoppingBag, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AccountMenu } from "@/components/storefront/account-menu";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";

export function StorefrontHeader() {
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" type="button" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <BrandLogo href="/" size="md" priority className="min-w-0" />
        <nav className="hidden flex-1 items-center gap-6 px-4 text-sm font-medium md:flex">
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
        <form action="/search" method="get" className="mx-2 hidden max-w-md flex-1 items-center gap-2 md:flex">
          <input
            name="q"
            type="search"
            placeholder="Search products…"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
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
