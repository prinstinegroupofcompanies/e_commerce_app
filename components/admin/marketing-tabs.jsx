"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/marketing/coupons", label: "Coupons" },
  { href: "/admin/marketing/flash-deals", label: "Flash deals" },
  { href: "/admin/marketing/notifications", label: "Notifications" },
  { href: "/admin/marketing/subscribers", label: "Subscribers" },
  { href: "/admin/marketing/advertisements", label: "Advertisements" },
];

export function MarketingTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex flex-wrap gap-1 border-b border-primary/10">
      {tabs.map((t) => {
        const isActive = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
