import Link from "next/link";
import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { Button } from "@/components/ui/button";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/track-order", label: "Track order" },
  { href: "/compare", label: "Compare" },
  { href: "/blog", label: "Blog" },
];

const portalLinks = [
  { href: "/dashboard", label: "My account" },
  { href: "/seller/register", label: "Sell on ShopLIB" },
  { href: "/seller/login", label: "Seller login" },
  { href: "/admin/login", label: "Admin" },
];

const legalLinks = [
  { href: "/pages/privacy", label: "Privacy policy" },
  { href: "/pages/terms", label: "Terms of service" },
];

export function StorefrontFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-primary/15">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-background to-accent/[0.08]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-5">
            <BrandLogo href="/" size="lg" />
            <p className="max-w-md text-base font-medium leading-relaxed text-foreground">{SITE_TAGLINE}</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Shop from trusted independent sellers, compare products, and checkout securely — all in one modern
              marketplace built for {SITE_NAME}.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                support@shoplib.example
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                +231 770 000 000
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Monrovia, Liberia
              </li>
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Shop</p>
              <ul className="mt-4 space-y-2.5">
                {shopLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Account</p>
              <ul className="mt-4 space-y-2.5">
                {portalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Legal</p>
              <ul className="mt-4 space-y-2.5">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-primary/20 bg-card/80 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm sm:p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Stay in the loop</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Get drops, deals, and new seller highlights — no spam, unsubscribe anytime.
              </p>
              <div className="mt-4">
                <NewsletterForm />
              </div>
              <Button className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/products">Start shopping</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary/15 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {year} {SITE_NAME}. All rights reserved. Built for modern multivendor commerce.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/pages/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            <Link href="/pages/terms" className="transition hover:text-foreground">
              Terms
            </Link>
            <Link href="/seller/register" className="transition hover:text-foreground">
              Become a seller
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
