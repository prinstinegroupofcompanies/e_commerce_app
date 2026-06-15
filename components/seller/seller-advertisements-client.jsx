"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function SellerAdvertisementsClient() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({
    title: "",
    image: "",
    link: "",
    placement: "homepage_banner",
    durationDays: 7,
    amount: 50,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/seller/advertisements")
      .then((r) => r.json())
      .then((j) => setAds(j.success ? j.data : []));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed");
        return;
      }
      toast.success("Advert submitted for admin review");
      setForm({ title: "", image: "", link: "", placement: "homepage_banner", durationDays: 7, amount: 50 });
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">New advertisement</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Link (optional)</Label>
          <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Placement</Label>
            <select
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value })}
            >
              <option value="homepage_banner">Homepage banner</option>
              <option value="slideshow">Slideshow</option>
              <option value="featured_product">Featured product</option>
              <option value="sponsored_store">Sponsored store</option>
              <option value="popup">Pop-up promotion</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Proposed fee (USD)</Label>
          <Input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </div>
        <Button type="submit" disabled={saving}>
          Submit for review
        </Button>
      </form>
      <ul className="space-y-3">
        {ads.map((ad) => (
          <li key={ad.id} className="flex items-center justify-between rounded-lg border p-4 text-sm">
            <div>
              <p className="font-medium">{ad.title}</p>
              <p className="text-muted-foreground capitalize">
                {ad.placement.replace(/_/g, " ")} · {ad.durationDays} days · ${ad.amount}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {ad.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
