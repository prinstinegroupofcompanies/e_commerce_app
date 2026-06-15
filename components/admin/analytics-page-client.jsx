"use client";

import { Suspense } from "react";
import { AnalyticsToolbar } from "@/components/admin/analytics-toolbar";

/**
 * @param {{ days: number }} props
 */
export function AnalyticsPageClient({ days }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsToolbar days={days} />
    </Suspense>
  );
}
