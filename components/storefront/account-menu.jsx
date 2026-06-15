"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Package, Heart, Wallet, Settings, ShoppingBag } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Account overview", icon: User },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/addresses", label: "Addresses", icon: ShoppingBag },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const isCustomer = status === "authenticated" && session?.user?.role === "customer";
  const isSeller = status === "authenticated" && session?.user?.role === "seller";

  if (!isCustomer && !isSeller) {
    return (
      <Link
        href="/login"
        aria-label="Sign in"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/10 bg-card px-2 text-sm text-primary hover:bg-primary/5"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {session.user.name?.[0]?.toUpperCase() || "U"}
          </span>
        )}
        <span className="hidden text-xs font-medium sm:inline">
          {session.user.name?.split(" ")[0] || "Account"}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-md border border-primary/10 bg-card shadow-lg">
          <div className="border-b border-primary/10 px-3 py-2">
            <p className="text-sm font-semibold">{session.user.name || "Welcome"}</p>
            <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          {isSeller ? (
            <Link
              href="/seller/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Seller dashboard
            </Link>
          ) : (
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-2 border-t border-primary/10 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
