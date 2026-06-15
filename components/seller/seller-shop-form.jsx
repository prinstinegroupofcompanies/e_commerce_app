"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { slugify } from "@/lib/slug";

export function SellerShopForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    shopSlug: "",
    shopDescription: "",
    shopLogo: "",
    shopBanner: "",
    shopAddress: "",
    shopCity: "",
    shopCountry: "",
    isShopActive: true,
  });

  useEffect(() => {
    fetch("/api/seller/shop")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setForm({
            shopName: json.data.shopName ?? "",
            shopSlug: json.data.shopSlug ?? "",
            shopDescription: json.data.shopDescription ?? "",
            shopLogo: json.data.shopLogo ?? "",
            shopBanner: json.data.shopBanner ?? "",
            shopAddress: json.data.shopAddress ?? "",
            shopCity: json.data.shopCity ?? "",
            shopCountry: json.data.shopCountry ?? "",
            isShopActive: json.data.isShopActive ?? true,
          });
          setSlugManual(Boolean(json.data.shopSlug));
        }
        setLoading(false);
      });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shopDescription: form.shopDescription || null,
          shopLogo: form.shopLogo || null,
          shopBanner: form.shopBanner || null,
          shopAddress: form.shopAddress || null,
          shopCity: form.shopCity || null,
          shopCountry: form.shopCountry || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not save");
        setSaving(false);
        return;
      }
      toast.success("Shop settings saved");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading shop…</p>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Shop profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Shop name</Label>
            <Input
              required
              value={form.shopName}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  shopName: name,
                  shopSlug: slugManual ? f.shopSlug : slugify(name),
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Shop URL slug</Label>
            <Input
              required
              value={form.shopSlug}
              onChange={(e) => {
                setSlugManual(true);
                setForm({ ...form, shopSlug: slugify(e.target.value) });
              }}
            />
            {form.shopSlug ? (
              <p className="text-xs text-muted-foreground">Storefront: /shop/{form.shopSlug}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.shopDescription}
              onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shop logo</Label>
              <ImageUpload
                value={form.shopLogo || null}
                onChange={(url) => setForm((f) => ({ ...f, shopLogo: url || "" }))}
                folder="uploads/shops"
                label="Upload logo"
                shape="square"
                size={72}
              />
            </div>
            <div className="space-y-2">
              <Label>Shop banner</Label>
              <ImageUpload
                value={form.shopBanner || null}
                onChange={(url) => setForm((f) => ({ ...f, shopBanner: url || "" }))}
                folder="uploads/shops"
                label="Upload banner"
                shape="square"
                size={72}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.shopAddress} onChange={(e) => setForm({ ...form, shopAddress: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.shopCity} onChange={(e) => setForm({ ...form, shopCity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.shopCountry} onChange={(e) => setForm({ ...form, shopCountry: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isShopActive}
              onChange={(e) => setForm({ ...form, isShopActive: e.target.checked })}
            />
            Shop visible on marketplace
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save shop"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
