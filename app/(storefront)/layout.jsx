import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartRemoteSync } from "@/components/storefront/cart-remote-sync";
import { CompareBar } from "@/components/storefront/compare-bar";
import { ShopAssistant } from "@/components/chat/shop-assistant";
import { InteractionTracker } from "@/components/chat/interaction-tracker";
import { SITE_NAME } from "@/lib/brand";

export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CartRemoteSync />
      <div className="border-b border-brand-gold/30 bg-primary py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 sm:flex-row sm:gap-6 sm:px-6 lg:px-8">
          <span>{SITE_NAME} — multivendor marketplace</span>
          <span className="hidden text-primary-foreground/70 sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-accent">Free shipping on orders over $50</span>
        </div>
      </div>
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CartDrawer />
      <CompareBar />
      <InteractionTracker />
      <ShopAssistant />
    </div>
  );
}
