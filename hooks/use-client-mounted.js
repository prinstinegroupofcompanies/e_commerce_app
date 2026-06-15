"use client";

import { useEffect, useState } from "react";

/** True after the component has mounted on the client (avoids SSR hydration mismatches). */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
