"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryMap } from "@/components/storefront/delivery-map";
import { formatOrderStatus } from "@/lib/order-labels";

export function TrackOrderForm({ defaultCode = "", defaultEmail = "" }) {
  const [code, setCode] = useState(defaultCode);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Could not find that order");
      } else {
        setOrder(json.data);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Look up your order</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-[1fr,1fr,auto]" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="code">Order code</Label>
              <Input
                id="code"
                placeholder="ORD-XXXX-XXXX"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email used at checkout</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Searching…" : "Track"}
              </Button>
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {order ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Order {order.code}{" "}
              <Badge variant="outline" className="ml-2">{formatOrderStatus(order.orderStatus)}</Badge>
              <Badge variant="outline" className="ml-2 capitalize">{order.paymentStatus}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Placed</p>
                <p className="font-medium">{new Date(order.placedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="font-medium tabular-nums">${order.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracking</p>
                <p className="font-mono text-xs">{order.trackingId || "—"}</p>
              </div>
            </div>

            {order.isPickup ? (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Pickup order</p>
                {order.pickupPoint ? (
                  <>
                    <p className="mt-1 font-medium">{order.pickupPoint.name}</p>
                    <p className="text-muted-foreground">{order.pickupPoint.address}</p>
                    <p className="text-muted-foreground">
                      {order.pickupPoint.city}, {order.pickupPoint.country}
                    </p>
                    {order.pickupPoint.hours ? (
                      <p className="text-muted-foreground">Hours: {order.pickupPoint.hours}</p>
                    ) : null}
                  </>
                ) : order.shippingAddress?.pickupPointName ? (
                  <>
                    <p className="mt-1 font-medium">{order.shippingAddress.pickupPointName}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.pickupAddress}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Items</p>
              <ul className="mt-2 divide-y rounded-md border">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {i.quantity} · {i.deliveryStatus}
                        {i.trackingId ? ` · ${i.trackingId}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {order.deliveryAssignments?.length > 0 ? (
              <div className="space-y-4">
                {order.deliveryCompany ? (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Courier: </span>
                    <span className="font-medium">{order.deliveryCompany.name}</span>
                  </p>
                ) : null}
                {order.deliveryAssignments.map((a, idx) => {
                  const lat = a.riderLat ?? a.rider?.currentLat;
                  const lng = a.riderLng ?? a.rider?.currentLng;
                  return (
                    <div key={idx} className="space-y-2">
                      <p className="text-sm capitalize text-muted-foreground">
                        Status: {a.status.replace(/_/g, " ")}
                        {a.rider?.name ? ` · Rider ${a.rider.name}` : ""}
                        {a.etaMinutes ? ` · ETA ~${a.etaMinutes} min` : ""}
                      </p>
                      <DeliveryMap lat={lat} lng={lng} label="Live delivery map" />
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeline</p>
              <ol className="mt-2 space-y-3 border-l-2 border-primary/20 pl-4">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx}>
                    <p className="font-medium">{formatOrderStatus(h.label || h.status)}</p>
                    {h.comment ? <p className="text-xs text-muted-foreground">{h.comment}</p> : null}
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
