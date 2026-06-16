"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/blog/posts", label: "Posts" },
  { href: "/admin/blog/categories", label: "Categories" },
  { href: "/admin/blog/tags", label: "Tags" },
];

export function BlogTabs() {
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
