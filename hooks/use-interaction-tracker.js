"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { trackInteraction } from "@/lib/analytics/track-client";

/**
 * Global storefront behavior tracking (page views, scroll depth on product pages).
 */
export function useInteractionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const lastPath = useRef("");
  const scrollMarks = useRef(new Set());

  const customerId =
    session?.user?.role === "customer" ? session.user.id : undefined;

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    scrollMarks.current = new Set();

    const query = searchParams?.toString();
    trackInteraction({
      eventType: "page_view",
      path: query ? `${pathname}?${query}` : pathname,
      metadata: query ? { query: searchParams.get("q") || undefined } : undefined,
      customerId,
    });

    if (pathname.startsWith("/search") && searchParams?.get("q")) {
      trackInteraction({
        eventType: "search",
        path: pathname,
        metadata: { query: searchParams.get("q") },
        customerId,
      });
    }
  }, [pathname, searchParams, customerId]);

  useEffect(() => {
    const productMatch = pathname?.match(/^\/products\/([^/]+)$/);
    if (!productMatch) return;

    const slug = productMatch[1];

    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) return;
      const pct = Math.round((window.scrollY / max) * 100);
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !scrollMarks.current.has(mark)) {
          scrollMarks.current.add(mark);
          trackInteraction({
            eventType: "scroll_depth",
            path: pathname,
            metadata: { slug, depth: mark },
            customerId,
          });
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, customerId]);
}
