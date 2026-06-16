import Link from "next/link";
import { cn } from "@/lib/utils";
import { LOGO_SRC, SITE_NAME } from "@/lib/brand";

const heightClass = {
  sm: "h-8 max-h-8",
  md: "h-10 max-h-10 sm:h-11",
  lg: "h-14 max-h-14",
  xl: "h-[4.5rem] max-h-[4.5rem]",
};

/**
 * @param {{
 *   href?: string | null;
 *   size?: keyof typeof heightClass;
 *   className?: string;
 *   imageClassName?: string;
 *   priority?: boolean;
 *   variant?: "default" | "splash";
 * }} props
 */
export function BrandLogo({
  href = "/",
  size = "md",
  className,
  imageClassName,
  priority,
  variant = "default",
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={SITE_NAME}
      className={cn(
        "w-auto object-contain bg-transparent",
        heightClass[size],
        variant === "splash" ? "drop-shadow-md" : "",
        imageClassName
      )}
      style={{ background: "transparent" }}
      fetchPriority={priority ? "high" : undefined}
    />
  );

  if (href == null) {
    return <span className={cn("inline-flex items-center bg-transparent", className)}>{img}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center bg-transparent", className)}>
      {img}
    </Link>
  );
}
