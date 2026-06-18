"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProductGalleryImages } from "@/lib/product-images";
import { MediaImage } from "@/components/shared/media-image";

/**
 * Tap/click cycles images; tap again on last image opens the product page.
 *
 * @param {{
 *   slug: string;
 *   name: string;
 *   thumbnail?: string | null;
 *   images?: string | string[] | null;
 *   className?: string;
 * }} props
 */
export function ProductCardMedia({ slug, name, thumbnail, images, className }) {
  const router = useRouter();
  const gallery = useMemo(
    () => {
      const list = getProductGalleryImages({ thumbnail, images });
      return list.length ? list : ["/placeholder-product.svg"];
    },
    [thumbnail, images]
  );

  const [idx, setIdx] = useState(0);
  const hasMultiple = gallery.length > 1;
  const atLast = idx >= gallery.length - 1;

  function handleActivate(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!hasMultiple) {
      router.push(`/products/${slug}`);
      return;
    }

    if (!atLast) {
      setIdx((i) => i + 1);
      return;
    }

    router.push(`/products/${slug}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate(e);
    }
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/media relative block aspect-square w-full overflow-hidden bg-muted text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={
        hasMultiple && !atLast
          ? `${name}: show next image (${idx + 1} of ${gallery.length})`
          : `View ${name}`
      }
    >
      <MediaImage
        key={gallery[idx]}
        src={gallery[idx]}
        alt={name}
        className="h-full w-full object-cover transition duration-500 group-hover/media:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover/media:opacity-100" />

      {hasMultiple ? (
        <>
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <Images className="h-3 w-3" aria-hidden />
            {idx + 1}/{gallery.length}
          </span>
          {!atLast ? (
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              Tap for next photo
            </span>
          ) : (
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow">
              Tap to view product
            </span>
          )}
          <div className="absolute bottom-2 right-2 flex gap-1">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </button>
  );
}
