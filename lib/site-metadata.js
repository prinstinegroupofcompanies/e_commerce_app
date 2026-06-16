import { LOGO_SRC, SITE_NAME } from "@/lib/brand";

/** Shared favicon / PWA / social preview icons (Markay Hall logo). */
export const SITE_ICONS = {
  icon: [{ url: LOGO_SRC, type: "image/jpeg", sizes: "any" }],
  apple: [{ url: LOGO_SRC, type: "image/jpeg", sizes: "180x180" }],
  shortcut: LOGO_SRC,
};

/**
 * @param {string} [description]
 */
export function createRootMetadata(description) {
  const desc =
    description ||
    `${SITE_NAME} is a multivendor e-commerce marketplace — shop from trusted sellers with secure checkout.`;

  return {
    title: {
      default: `${SITE_NAME} — Multivendor marketplace`,
      template: `%s · ${SITE_NAME}`,
    },
    description: desc,
    manifest: "/manifest.json",
    icons: SITE_ICONS,
    other: {
      "mobile-web-app-capable": "yes",
    },
    openGraph: {
      title: SITE_NAME,
      description: desc,
      images: [{ url: LOGO_SRC, alt: SITE_NAME }],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: SITE_NAME,
      description: desc,
      images: [LOGO_SRC],
    },
    appleWebApp: {
      title: SITE_NAME,
      statusBarStyle: "default",
    },
  };
}

/**
 * Section layouts inherit logo icons at every portal level.
 * @param {string} title
 * @param {string} [description]
 */
export function createSectionMetadata(title, description) {
  const desc = description || `${title} — ${SITE_NAME}`;
  return {
    title,
    description: desc,
    icons: SITE_ICONS,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description: desc,
      images: [{ url: LOGO_SRC, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary",
      title: `${title} · ${SITE_NAME}`,
      images: [LOGO_SRC],
    },
  };
}
