import backgroundBanner from "@/assets/background_banner.jpg";

/** @type {string} */
export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall";

export const SITE_TAGLINE = "Your marketplace for quality finds";

/** Public URL for the Markay Hall logo */
export const LOGO_SRC = "/markay_hall.jpeg";

/** Homepage & catalog hero background (bundled so deploys always include the asset) */
export const BACKGROUND_BANNER_SRC = backgroundBanner.src;

/** Brand palette (matches logo) — royal blue & gold */
export const BRAND = {
  blue: "#002395",
  gold: "#FFBF00",
};
