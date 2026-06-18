"use client";

import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/upload-url";

/**
 * Image with automatic media URL resolution and placeholder fallback on load error.
 *
 * @param {{
 *   src?: string | null;
 *   alt?: string;
 *   fallback?: string;
 *   className?: string;
 * }} props
 */
export function MediaImage({ src, alt = "", fallback = "/placeholder-product.svg", className, ...props }) {
  const resolved = resolveMediaUrl(src) || fallback;
  const [current, setCurrent] = useState(resolved);

  useEffect(() => {
    setCurrent(resolveMediaUrl(src) || fallback);
  }, [src, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      {...props}
    />
  );
}
