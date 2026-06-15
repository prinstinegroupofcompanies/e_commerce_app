"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyForm = {
  label: "Home",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  isDefault: false,
};

export function CustomerAddressesManager() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/customer/addresses");
    const json = await res.json();
    if (json.success) setAddresses(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Address added");
      setForm(emptyForm);
      router.refresh();
      await load();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Could not delete");
      return;
    }
    toast.success("Address removed");
    router.refresh();
    await load();
  }

  async function setDefault(id) {
    const res = await fetch(`/api/customer/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Could not update");
      return;
    }
    toast.success("Default address updated");
    router.refresh();
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {a.isDefault ? <Badge className="mb-2">Default</Badge> : null}
                    <p className="font-medium">
                      {a.firstName} {a.lastName} · {a.label}
                    </p>
                    <p className="mt-1 text-muted-foreground">{a.address}</p>
                    <p className="text-muted-foreground">
                      {a.city}
                      {a.state ? `, ${a.state}` : ""} {a.zipCode || ""}
                    </p>
                    <p className="text-muted-foreground">{a.country}</p>
                    <p className="mt-1">{a.phone}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!a.isDefault ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setDefault(a.id)}>
                      Set default
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="destructive" onClick={() => remove(a.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add address</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>First name</Label>
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Last name</Label>
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Street address</Label>
              <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>City</Label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Country</Label>
                <Input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>ZIP</Label>
                <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save address"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
