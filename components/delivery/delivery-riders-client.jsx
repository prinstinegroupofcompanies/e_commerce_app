"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function DeliveryRidersClient() {
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/delivery/riders")
      .then((r) => r.json())
      .then((j) => setRiders(j.success ? j.data : []));
  }

  useEffect(() => {
    load();
  }, []);

  async function addRider(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/delivery/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed");
        return;
      }
      toast.success("Rider added");
      setForm({ name: "", phone: "", email: "" });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function shareLocation(id) {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch(`/api/delivery/riders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentLat: pos.coords.latitude,
            currentLng: pos.coords.longitude,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Location updated");
          load();
        }
      },
      () => toast.error("Could not get location"),
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addRider} className="max-w-md space-y-3 rounded-lg border p-5">
        <h2 className="font-semibold">Add rider</h2>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email (optional)</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Button type="submit" disabled={busy}>
          Add rider
        </Button>
      </form>
      <ul className="space-y-3">
        {riders.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-muted-foreground">
                {r.phone}
                {r.email ? ` · ${r.email}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{r._count?.assignments ?? 0} assignments</p>
              {r.currentLat != null ? (
                <p className="text-xs text-muted-foreground">
                  Last location: {r.currentLat.toFixed(4)}, {r.currentLng?.toFixed(4)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.isActive ? "secondary" : "outline"}>{r.isActive ? "Active" : "Inactive"}</Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => shareLocation(r.id)}>
                Update GPS
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
