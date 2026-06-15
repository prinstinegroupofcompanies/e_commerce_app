"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";

const links = [
  { href: "/delivery/dashboard", label: "Dashboard" },
  { href: "/delivery/assignments", label: "Deliveries" },
  { href: "/delivery/riders", label: "Riders" },
];

export function DeliveryShell({ children }) {
  const pathname = usePathname();
  if (pathname === "/delivery/login" || pathname === "/delivery/register") {
    return <div className="min-h-screen bg-muted/30">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-56 border-r bg-card md:block">
        <div className="border-b p-4">
          <BrandLogo href="/delivery/dashboard" size="sm" />
          <p className="mt-1 text-xs text-muted-foreground">Delivery portal</p>
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-md px-3 py-2 text-sm ${pathname.startsWith(l.href) ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b bg-card px-4">
          <Button variant="outline" size="sm" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
