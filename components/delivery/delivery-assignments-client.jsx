"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DeliveryAssignmentsClient() {
  const [items, setItems] = useState([]);
  const [riders, setRiders] = useState([]);
  const [riderByAssignment, setRiderByAssignment] = useState({});

  function load() {
    fetch("/api/delivery/assignments")
      .then((r) => r.json())
      .then((j) => setItems(j.success ? j.data : []));
    fetch("/api/delivery/riders")
      .then((r) => r.json())
      .then((j) => setRiders(j.success ? j.data.filter((r) => r.isActive) : []));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action, extra = {}) {
    const res = await fetch(`/api/delivery/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, etaMinutes: 45, ...extra }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Failed");
      return;
    }
    toast.success("Updated");
    load();
  }

  async function assignRider(assignmentId) {
    const riderId = riderByAssignment[assignmentId];
    if (!riderId) {
      toast.error("Select a rider first");
      return;
    }
    await act(assignmentId, "assign_rider", { riderId });
    const rider = riders.find((r) => r.id === riderId);
    if (rider?.currentLat != null) {
      await act(assignmentId, "out_for_delivery", {
        riderLat: rider.currentLat,
        riderLng: rider.currentLng,
      });
    }
  }

  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-mono font-semibold">{a.order?.code}</p>
              <p className="text-muted-foreground">{a.seller?.shopName} → {a.deliveryAddress}</p>
              <p className="text-muted-foreground">Pickup: {a.pickupAddress}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {a.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {a.status === "pending_accept" ? (
              <>
                <Button size="sm" type="button" onClick={() => act(a.id, "accept")}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={() => act(a.id, "reject")}>
                  Reject
                </Button>
              </>
            ) : null}
            {["pending_accept", "accepted"].includes(a.status) && riders.length > 0 ? (
              <>
                <select
                  className="h-9 rounded-md border px-2 text-sm"
                  value={riderByAssignment[a.id] || a.riderId || ""}
                  onChange={(e) =>
                    setRiderByAssignment((s) => ({ ...s, [a.id]: e.target.value }))
                  }
                >
                  <option value="">Assign rider…</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="secondary" type="button" onClick={() => assignRider(a.id)}>
                  Assign rider
                </Button>
              </>
            ) : null}
            {a.status === "accepted" ? (
              <Button size="sm" type="button" onClick={() => act(a.id, "pickup")}>
                Confirm pickup
              </Button>
            ) : null}
            {["picked_up", "accepted"].includes(a.status) ? (
              <Button size="sm" type="button" onClick={() => act(a.id, "out_for_delivery")}>
                Out for delivery
              </Button>
            ) : null}
            {a.status === "out_for_delivery" ? (
              <Button size="sm" type="button" onClick={() => act(a.id, "arrived")}>
                Arrived
              </Button>
            ) : null}
          </div>
        </li>
      ))}
      {items.length === 0 ? <p className="text-muted-foreground">No delivery requests yet.</p> : null}
    </ul>
  );
}
