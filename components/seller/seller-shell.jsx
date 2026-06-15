"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NotificationsBell } from "@/components/shared/notifications-bell";
import { SITE_NAME } from "@/lib/brand";

const links = [
  { href: "/seller/dashboard", label: "Dashboard" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/inventory", label: "Inventory" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/seller/advertisements", label: "Advertisements" },
  { href: "/seller/shop", label: "Shop" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/wallet", label: "Wallet" },
  { href: "/seller/settings", label: "Settings" },
];

export function SellerShell({ children }) {
  const pathname = usePathname();
  if (pathname === "/seller/login" || pathname === "/seller/register") {
    return <div className="min-h-screen bg-muted/30">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-56 shrink-0 border-r border-primary/10 bg-card md:block">
        <div className="flex h-16 flex-col justify-center border-b border-primary/10 px-3 py-2">
          <BrandLogo href="/seller/dashboard" size="sm" />
          <span className="mt-1 text-xs text-muted-foreground">Seller portal</span>
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/seller/dashboard" && pathname.startsWith(`${l.href}/`));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm hover:bg-muted ${
                  active ? "bg-primary/10 font-medium text-primary" : ""
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-primary/10 bg-card px-4">
          <span className="text-sm font-medium text-muted-foreground md:hidden">{SITE_NAME} Seller</span>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Button variant="outline" size="sm" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
