"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   images: string[];
 *   productName: string;
 *   activeIndex?: number;
 *   onIndexChange?: (index: number) => void;
 * }} props
 */
export function ProductImageGallery({
  images,
  productName,
  activeIndex: controlledIndex,
  onIndexChange,
}) {
  const safe = images.length ? images : ["/placeholder-product.svg"];
  const [internalIdx, setInternalIdx] = useState(0);
  const idx = controlledIndex ?? internalIdx;
  const main = safe[Math.min(idx, safe.length - 1)];

  useEffect(() => {
    if (controlledIndex !== undefined && controlledIndex < safe.length) {
      setInternalIdx(controlledIndex);
    }
  }, [controlledIndex, safe.length]);

  function setIdx(next) {
    const clamped = ((next % safe.length) + safe.length) % safe.length;
    if (onIndexChange) onIndexChange(clamped);
    else setInternalIdx(clamped);
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={main}
          src={main}
          alt={productName}
          className="h-full w-full object-cover transition-opacity duration-300 ease-out motion-safe:animate-in motion-safe:fade-in-0"
        />
        {safe.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full opacity-0 shadow transition group-hover:opacity-100"
              onClick={() => setIdx(idx - 1)}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full opacity-0 shadow transition group-hover:opacity-100"
              onClick={() => setIdx(idx + 1)}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {safe.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === idx ? "w-6 bg-primary" : "w-1.5 bg-white/70 hover:bg-white"
                  )}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {safe.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {safe.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition duration-200",
                i === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
