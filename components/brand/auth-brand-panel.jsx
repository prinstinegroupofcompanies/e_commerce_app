import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";

/**
 * Centered logo block for sign-in / register screens.
 */
export function AuthBrandPanel() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <BrandLogo href="/" size="xl" priority className="justify-center" imageClassName="mx-auto object-center" />
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">{SITE_TAGLINE}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-widest text-primary">{SITE_NAME}</p>
    </div>
  );
}
