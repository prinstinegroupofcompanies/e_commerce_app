"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME } from "@/lib/brand";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/delivery-companies", label: "Delivery" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/marketing/coupons", label: "Marketing" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Shop analytics" },
  { href: "/admin/settings/general", label: "Settings" },
  { href: "/admin/integrations", label: "Integrations" },
];

export function AdminShell({ children }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-muted/30">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-56 shrink-0 border-r border-primary/10 bg-card md:block">
        <div className="flex h-16 items-center border-b border-primary/10 px-3">
          <BrandLogo href="/admin/dashboard" size="sm" />
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => {
            const base = l.href.split("/").slice(0, 3).join("/");
            const isActive = pathname === l.href || pathname.startsWith(`${base}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm hover:bg-muted ${
                  isActive ? "bg-primary/10 font-medium text-primary" : ""
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
          <span className="text-sm font-medium text-muted-foreground md:hidden">{SITE_NAME} Admin</span>
          <Button variant="outline" size="sm" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
