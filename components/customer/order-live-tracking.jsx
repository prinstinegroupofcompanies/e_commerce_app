"use client";

import { useEffect, useState } from "react";
import { DeliveryMap } from "@/components/storefront/delivery-map";
import { Badge } from "@/components/ui/badge";

/**
 * @param {{ orderId: string; initialAssignments: { id: string; status: string; riderLat?: number | null; riderLng?: number | null; etaMinutes?: number | null; rider?: { name?: string; phone?: string } | null }[] }}
 */
export function OrderLiveTracking({ orderId, initialAssignments }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/customer/orders/${orderId}/tracking`);
        const json = await res.json();
        if (cancelled || !json.success) return;
        setAssignments(json.data.assignments || []);
        setOrderStatus(json.data.orderStatus || "");
      } catch {
        /* ignore */
      }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderId]);

  if (!assignments.length) return null;

  const primary = assignments[0];
  const lat = primary.riderLat;
  const lng = primary.riderLng;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Live delivery tracking</p>
        {orderStatus ? (
          <Badge variant="outline" className="capitalize">
            {orderStatus}
          </Badge>
        ) : null}
      </div>
      <p className="text-sm capitalize text-muted-foreground">
        {primary.status.replace(/_/g, " ")}
        {primary.rider?.name ? ` · ${primary.rider.name}` : ""}
        {primary.etaMinutes ? ` · ETA ~${primary.etaMinutes} min` : ""}
      </p>
      <DeliveryMap lat={lat} lng={lng} />
      <p className="text-xs text-muted-foreground">Map refreshes every 15 seconds.</p>
    </div>
  );
}
