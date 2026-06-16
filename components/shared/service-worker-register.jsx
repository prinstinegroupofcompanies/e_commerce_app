"use client";

import { useEffect } from "react";

/** Registers service worker for web push — skipped on admin to avoid stale cached pages. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const path = window.location.pathname;
    const skipSw = path.startsWith("/admin") || path.startsWith("/seller") || path.startsWith("/delivery");

    if (skipSw) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
