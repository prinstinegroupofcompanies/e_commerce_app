"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll section with arrow controls and snap.
 *
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   action?: React.ReactNode;
 *   children: React.ReactNode;
 *   className?: string;
 *   itemClassName?: string;
 * }} props
 */
export function HorizontalScrollRail({ title, subtitle, action, children, className, itemClassName }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  function scrollByDir(dir) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(280, el.clientWidth * 0.75);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <section className={cn("relative", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Discover</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground md:text-base">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {action}
          <div className="hidden gap-1 sm:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => scrollByDir(-1)}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => scrollByDir(1)}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {Array.isArray(children)
            ? children.map((child, i) => (
                <div
                  key={child?.key ?? i}
                  className={cn(
                    "w-[min(280px,78vw)] shrink-0 snap-start sm:w-[min(300px,42vw)] lg:w-[min(280px,24vw)]",
                    itemClassName
                  )}
                >
                  {child}
                </div>
              ))
            : children}
        </div>
      </div>
    </section>
  );
}
