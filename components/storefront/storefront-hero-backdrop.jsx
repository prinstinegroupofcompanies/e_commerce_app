import { BACKGROUND_BANNER_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Decorative hero strip with optional background image and overlay.
 *
 * @param {{
 *   children: React.ReactNode;
 *   className?: string;
 *   contentClassName?: string;
 *   tall?: boolean;
 * }} props
 */
export function StorefrontHeroBackdrop({ children, className, contentClassName, tall = false }) {
  return (
    <section className={cn("relative overflow-hidden border-b border-white/10", className)}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BACKGROUND_BANNER_SRC} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#002395]/92 via-[#001a6e]/88 to-[#000d3d]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,191,0,0.18),transparent_55%)]" />
      </div>
      <div
        className={cn(
          "relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
          tall ? "pb-12 pt-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-12" : "py-10 sm:py-12",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
