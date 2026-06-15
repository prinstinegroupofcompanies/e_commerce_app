"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Auto-advancing horizontal carousel with manual controls.
 *
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   eyebrow?: string;
 *   action?: React.ReactNode;
 *   children: React.ReactNode;
 *   className?: string;
 *   itemClassName?: string;
 *   autoPlayInterval?: number;
 *   defaultAutoPlay?: boolean;
 * }} props
 */
export function AutoCarousel({
  title,
  subtitle,
  eyebrow = "Discover",
  action,
  children,
  className,
  itemClassName,
  autoPlayInterval = 4500,
  defaultAutoPlay = true,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [autoPlay, setAutoPlay] = useState(defaultAutoPlay);
  const [paused, setPaused] = useState(false);

  const items = Array.isArray(children) ? children : [children];

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
  }, [updateScrollState, items.length]);

  const scrollByDir = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.firstElementChild;
    const gap = 16;
    const step = (first?.clientWidth ?? 280) + gap;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;

    if (dir > 0 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir < 0 && el.scrollLeft <= 4) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoPlay || paused || items.length <= 1) return;
    const id = setInterval(() => scrollByDir(1), autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, paused, items.length, autoPlayInterval, scrollByDir]);

  return (
    <section
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {action}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setAutoPlay((v) => !v)}
            aria-label={autoPlay ? "Pause auto-scroll" : "Resume auto-scroll"}
          >
            {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => scrollByDir(-1)}
            disabled={!canScrollLeft && items.length <= 1}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => scrollByDir(1)}
            disabled={!canScrollRight && items.length <= 1}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-8">
        <div
          ref={scrollRef}
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scroll-smooth",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {items.map((child, i) => (
            <div
              key={child?.key ?? i}
              className={cn(
                "w-[min(280px,78vw)] shrink-0 snap-start sm:w-[min(300px,42vw)] lg:w-[min(280px,24vw)]",
                itemClassName
              )}
            >
              {child}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-background/95 to-transparent sm:w-14"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-background/95 to-transparent sm:w-14"
          aria-hidden
        />
      </div>
    </section>
  );
}
