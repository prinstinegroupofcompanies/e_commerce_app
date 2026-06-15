"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANALYTICS_DAY_OPTIONS } from "@/lib/chat/analytics-range";

/**
 * @param {{ days: number }} props
 */
export function AnalyticsToolbar({ days }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setDays(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(next));
    router.push(`/admin/analytics?${params.toString()}`);
  }

  const exportEventsUrl = `/api/admin/analytics/export?days=${days}&type=events`;
  const exportSummaryUrl = `/api/admin/analytics/export?days=${days}&type=summary`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {ANALYTICS_DAY_OPTIONS.map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={days === d ? "default" : "outline"}
            onClick={() => setDays(d)}
          >
            {d === 7 ? "7 days" : d === 30 ? "30 days" : d === 90 ? "90 days" : "1 year"}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href={exportEventsUrl} download>
            <Download className="mr-1.5 h-4 w-4" />
            Export events CSV
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={exportSummaryUrl} download>
            <Download className="mr-1.5 h-4 w-4" />
            Export summary CSV
          </a>
        </Button>
      </div>
    </div>
  );
}
