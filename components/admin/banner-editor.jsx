"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, X, Check, Upload, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/upload-url";
import { uploadImageFile } from "@/lib/upload-client";

/**
 * @param {{
 *   banner: { id: string; title: string; image: string; link: string | null; position: string; sortOrder: number; isActive: boolean };
 * }} props
 */
export function BannerEditorRow({ banner }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: banner.title,
    image: banner.image,
    link: banner.link || "",
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
  });
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          image: form.image,
          link: form.link || null,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Save failed");
      } else {
        toast.success("Banner updated");
        setEditing(false);
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Delete this banner?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Delete failed");
      } else {
        toast.success("Banner deleted");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function toggleActive() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Toggle failed");
      } else {
        toast.success(banner.isActive ? "Banner deactivated" : "Banner activated");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadImageFile(file, "uploads/banners");
      setForm((f) => ({ ...f, image: path || "" }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload error");
    }
    setUploading(false);
  }

  if (editing) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="relative w-40 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(form.image)}
              alt={form.title}
              className="aspect-video w-full object-cover"
            />
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
              <Upload className="h-5 w-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
            </label>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor={`banner-title-${banner.id}`}>Title</Label>
              <Input
                id={`banner-title-${banner.id}`}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor={`banner-image-${banner.id}`}>Image URL</Label>
              <Input
                id={`banner-image-${banner.id}`}
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="Paste URL or upload above"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`banner-link-${banner.id}`}>Link</Label>
                <Input
                  id={`banner-link-${banner.id}`}
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="/products"
                />
              </div>
              <div>
                <Label htmlFor={`banner-order-${banner.id}`}>Sort order</Label>
                <Input
                  id={`banner-order-${banner.id}`}
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="accent-primary"
              />
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setForm({ title: banner.title, image: banner.image, link: banner.link || "", sortOrder: banner.sortOrder, isActive: banner.isActive });
            }}
            disabled={saving}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !form.title.trim() || !form.image.trim()}>
            <Check className="mr-1 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolveMediaUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{banner.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {banner.link || "No link"} · {banner.position} · order {banner.sortOrder}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {banner.isActive ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        )}
        <Button size="sm" variant="ghost" onClick={toggleActive} disabled={saving}>
          {banner.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove} disabled={saving}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
