"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { resolveMediaUrl } from "@/lib/upload-url";

const SLOT_LABELS = ["Main hero (large)", "Side banner 1", "Side banner 2"];

/**
 * @param {{
 *   banners: { id: string; title: string; image: string; link: string | null; isActive: boolean; sortOrder: number }[];
 * }} props
 */
export function HomepageBannersEditor({ banners }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(
    banners.map((b) => ({
      id: b.id,
      title: b.title,
      image: b.image,
      link: b.link || "",
      isActive: b.isActive,
    }))
  );

  function updateSlot(index, patch) {
    setForm((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    const payload = form.map((slot, index) => ({
      id: slot.id,
      title: slot.title.trim() || `Hero banner ${index + 1}`,
      image: slot.image.trim() || "/placeholder-banner.svg",
      link: slot.link.trim() || null,
      isActive: slot.isActive,
    }));

    for (const slot of payload) {
      if (!slot.id) {
        toast.error("Banner data is incomplete — refresh the page and try again");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: payload }),
      });
      const json = await res.json();
      if (!json.success) {
        const detail = json.errors ? Object.values(json.errors).flat().join(" ") : "";
        toast.error(detail ? `${json.error}: ${detail}` : json.error || "Save failed");
      } else {
        toast.success("Homepage banners saved — changes are live on refresh");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Upload three images for the storefront hero. Active banners appear on the homepage immediately after saving.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Preview storefront
            </a>
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save all banners"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {form.map((slot, index) => (
          <Card key={slot.id} className={index === 0 ? "lg:col-span-3" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  Banner {index + 1}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{SLOT_LABELS[index]}</span>
                </span>
                <label className="flex items-center gap-2 text-xs font-normal">
                  <input
                    type="checkbox"
                    checked={slot.isActive}
                    onChange={(e) => updateSlot(index, { isActive: e.target.checked })}
                    className="rounded border-input"
                  />
                  Active on homepage
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`overflow-hidden rounded-lg border bg-muted ${index === 0 ? "aspect-[21/9]" : "aspect-video"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(slot.image) || "/placeholder-banner.svg"}
                  alt={slot.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <ImageUpload
                value={slot.image}
                onChange={(url) => updateSlot(index, { image: url || "" })}
                folder="uploads/banners"
                label="Upload image"
                shape="square"
                size={72}
              />
              <div className="space-y-2">
                <Label htmlFor={`title-${index}`}>Title</Label>
                <Input
                  id={`title-${index}`}
                  value={slot.title}
                  onChange={(e) => updateSlot(index, { title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`link-${index}`}>Link (optional)</Label>
                <Input
                  id={`link-${index}`}
                  value={slot.link}
                  onChange={(e) => updateSlot(index, { link: e.target.value })}
                  placeholder="/products"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
