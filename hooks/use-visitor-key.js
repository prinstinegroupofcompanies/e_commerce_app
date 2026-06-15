"use client";

import { useEffect, useState } from "react";
import { ensureVisitorCookie, getVisitorKey } from "@/lib/analytics/track-client";

export function useVisitorKey() {
  const [key, setKey] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const k = getVisitorKey();
    setKey(k);
    if (k) ensureVisitorCookie();
  }, []);

  return key;
}
