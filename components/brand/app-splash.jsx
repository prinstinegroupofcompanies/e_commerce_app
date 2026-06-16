"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME } from "@/lib/brand";

const SPLASH_MS = 1000;

export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFade(true), SPLASH_MS - 200);
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-200 ${
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={fade}
    >
      <BrandLogo href={null} size="xl" priority variant="splash" />
      <p className="mt-4 text-sm font-medium tracking-wide text-muted-foreground">{SITE_NAME}</p>
      <div className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full origin-left animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}
