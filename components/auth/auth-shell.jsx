import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

const PORTAL_COPY = {
  customer: {
    badge: "Customer",
    title: "Welcome back",
    subtitle: "Sign in to shop, track orders, and manage your account.",
  },
  admin: {
    badge: "Admin",
    title: "Administrator sign in",
    subtitle: "Secure access to marketplace operations and settings.",
  },
  seller: {
    badge: "Seller",
    title: "Seller sign in",
    subtitle: "Manage your store, products, and customer orders.",
  },
  delivery: {
    badge: "Delivery",
    title: "Partner sign in",
    subtitle: "Manage riders, assignments, and deliveries.",
  },
  register: {
    badge: "Join Markay Hall",
    title: "Create your account",
    subtitle: "Start shopping Liberia's trusted multivendor marketplace.",
  },
};

/**
 * Modern centered auth layout with logo always visible above the form.
 */
export function AuthShell({ portal = "customer", children, className, showPortalLinks = true }) {
  const copy = PORTAL_COPY[portal] || PORTAL_COPY.customer;

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-[#f4f6fb]", className)}>
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/markay_hall.jpeg"
          alt=""
          fill
          className="object-cover opacity-[0.07]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.12]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="/" size="xl" priority variant="splash" imageClassName="mx-auto" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{copy.badge}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>
          <div className="mt-4 h-1 w-16 rounded-full bg-accent" aria-hidden />
        </div>

        <div className="w-full">{children}</div>

        {showPortalLinks ? (
          <div className="mt-8 space-y-2 text-center text-xs text-muted-foreground">
            <p>
              <Link href="/" className="font-medium hover:text-primary hover:underline">
                ← Back to {SITE_NAME}
              </Link>
            </p>
            {portal === "customer" || portal === "register" ? (
              <p>
                <Link href="/admin/login" className="hover:underline">
                  Admin
                </Link>
                <span className="mx-2">·</span>
                <Link href="/seller/login" className="hover:underline">
                  Seller
                </Link>
                <span className="mx-2">·</span>
                <Link href="/delivery/login" className="hover:underline">
                  Delivery
                </Link>
              </p>
            ) : null}
            {portal === "admin" ? (
              <p>
                <Link href="/login" className="hover:underline">
                  Customer login
                </Link>
                <span className="mx-2">·</span>
                <Link href="/seller/login" className="hover:underline">
                  Seller login
                </Link>
              </p>
            ) : null}
            {portal === "seller" ? (
              <p>
                <Link href="/login" className="hover:underline">
                  Customer login
                </Link>
                <span className="mx-2">·</span>
                <Link href="/seller/register" className="hover:underline">
                  Register a store
                </Link>
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground/80">{SITE_TAGLINE}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
