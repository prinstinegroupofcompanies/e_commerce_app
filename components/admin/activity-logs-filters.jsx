"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ActivityLogsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [action, setAction] = useState(searchParams.get("action") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  function apply() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (action.trim()) params.set("action", action.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.push(qs ? `/admin/system/activity-logs?${qs}` : "/admin/system/activity-logs");
  }

  function clear() {
    setQ("");
    setAction("");
    setFrom("");
    setTo("");
    router.push("/admin/system/activity-logs");
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-card p-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Search</label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Subject, action, admin…"
          className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Action</label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="e.g. update"
          className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
      <Button type="button" size="sm" onClick={apply}>
        Filter
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}
