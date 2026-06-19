"use client";

import { useEffect } from "react";

const SW_CACHE_VERSION = "v2";

/** Clears legacy PWA caches that served stale storefront HTML after deploys. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const path = window.location.pathname;
    const isStorefront =
      !path.startsWith("/admin") &&
      !path.startsWith("/seller") &&
      !path.startsWith("/delivery");

    async function clearLegacyPwaCaches() {
      const flag = `sw-cache-cleared-${SW_CACHE_VERSION}`;
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");

      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    }

    clearLegacyPwaCaches().catch(() => {});

    // Storefront: skip SW registration so HTML/CSS updates apply immediately after deploy.
    if (isStorefront) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
