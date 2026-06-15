"use client";

import { useEffect } from "react";

/** Registers Markay Hall service worker for web push (no-op if unsupported). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
