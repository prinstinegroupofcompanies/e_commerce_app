import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

const PORTAL_COPY = {
  customer: {
    badge: "Customer account",
    headline: "Shop Liberia's best marketplace",
    description: "Sign in to track orders, manage your wallet, and save favorites.",
  },
  admin: {
    badge: "Administration",
    headline: "Store operations center",
    description: "Manage catalog, orders, sellers, and marketplace settings.",
  },
  seller: {
    badge: "Seller portal",
    headline: "Grow your shop on Markay Hall",
    description: "Fulfill orders, manage inventory, and reach customers nationwide.",
  },
  delivery: {
    badge: "Delivery partner",
    headline: "Logistics dashboard",
    description: "Accept assignments, update riders, and confirm deliveries.",
  },
};

/**
 * Shared auth layout — split brand panel + form column.
 */
export function AuthShell({ portal = "customer", children, className }) {
  const copy = PORTAL_COPY[portal] || PORTAL_COPY.customer;

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <aside className="relative hidden w-[44%] max-w-xl overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-primary" />
        <Image
          src="/markay_hall.jpeg"
          alt=""
          fill
          className="object-cover opacity-25 mix-blend-luminosity"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="relative z-10 flex flex-col gap-8 p-10 text-primary-foreground">
          <BrandLogo href="/" size="lg" priority className="brightness-0 invert" />
          <div className="space-y-4">
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {copy.badge}
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              {copy.headline}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/85">{copy.description}</p>
          </div>
        </div>
        <p className="relative z-10 p-10 text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} {SITE_NAME}. {SITE_TAGLINE}
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <BrandLogo href="/" size="lg" priority className="mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{copy.badge}</p>
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            ← Back to storefront
          </Link>
          {portal === "customer" ? (
            <>
              {" · "}
              <Link href="/admin/login" className="hover:underline">
                Admin
              </Link>
              {" · "}
              <Link href="/seller/login" className="hover:underline">
                Seller
              </Link>
            </>
          ) : null}
          {portal === "admin" ? (
            <>
              {" · "}
              <Link href="/seller/login" className="hover:underline">
                Seller login
              </Link>
            </>
          ) : null}
          {portal === "seller" ? (
            <>
              {" · "}
              <Link href="/login" className="hover:underline">
                Customer login
              </Link>
            </>
          ) : null}
        </p>
      </main>
    </div>
  );
}
