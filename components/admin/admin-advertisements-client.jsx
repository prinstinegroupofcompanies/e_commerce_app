"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminAdvertisementsClient() {
  const [ads, setAds] = useState([]);

  function load() {
    fetch("/api/admin/advertisements")
      .then((r) => r.json())
      .then((j) => setAds(j.success ? j.data : []));
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id, action) {
    const res = await fetch(`/api/admin/advertisements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Failed");
      return;
    }
    toast.success("Updated");
    load();
  }

  return (
    <ul className="space-y-3">
      {ads.map((ad) => (
        <li key={ad.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{ad.title}</p>
              <p className="text-sm text-muted-foreground">
                {ad.seller?.shopName} · {ad.placement} · ${ad.amount} · {ad.durationDays}d
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {ad.status}
            </Badge>
          </div>
          {ad.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <Button size="sm" type="button" onClick={() => patch(ad.id, "mark_paid")}>
                Mark paid
              </Button>
              <Button size="sm" type="button" onClick={() => patch(ad.id, "approve")}>
                Approve & go live
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => patch(ad.id, "reject")}>
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
      {ads.length === 0 ? <p className="text-sm text-muted-foreground">No advertisements yet.</p> : null}
    </ul>
  );
}
