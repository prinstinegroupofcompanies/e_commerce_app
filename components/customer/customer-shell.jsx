"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NotificationsBell } from "@/components/shared/notifications-bell";
import { SITE_NAME } from "@/lib/brand";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/wishlist", label: "Wishlist" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/refunds", label: "Refunds" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/addresses", label: "Addresses" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function CustomerShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-52 shrink-0 border-r bg-card lg:block">
        <div className="flex h-14 items-center border-b px-4 text-sm font-semibold">My account</div>
        <nav className="space-y-1 p-3">
          {links.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm hover:bg-muted ${
                  active ? "bg-muted font-medium" : ""
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
          <Link href="/" className="lg:hidden">
            <BrandLogo href="/" size="sm" />
          </Link>
          <span className="hidden text-sm text-muted-foreground lg:inline">{SITE_NAME}</span>
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
