"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** @param {{ orders: { id: string; code: string; total: number }[] }} props */
export function CustomerRefundsManager({ orders }) {
  const router = useRouter();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/customer/refunds");
    const json = await res.json();
    if (json.success) setRefunds(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!orderId) {
      toast.error("Select an order");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customer/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not submit");
        setSaving(false);
        return;
      }
      toast.success("Refund request submitted");
      setReason("");
      setOrderId("");
      router.refresh();
      await load();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refund requests yet.</p>
          ) : (
            refunds.map((r) => (
              <div key={r.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-medium">{r.order?.code}</span>
                  <Badge variant="outline" className="capitalize">
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1 tabular-nums font-medium">${r.amount.toFixed(2)}</p>
                {r.reason ? <p className="mt-1 text-muted-foreground">{r.reason}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a refund</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <select
                id="order"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Select order…</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} — ${o.total.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving || orders.length === 0}>
              {saving ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
