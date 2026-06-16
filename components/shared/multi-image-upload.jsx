"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/upload-url";

/**
 * @param {{
 *   value: string[];
 *   onChange: (urls: string[]) => void;
 *   folder?: string;
 *   maxImages?: number;
 * }} props
 */
export function MultiImageUpload({ value = [], onChange, folder = "products", maxImages = 12 }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  async function uploadFile(file) {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body });
    const j = await res.json();
    if (!res.ok || !j.success) {
      throw new Error(j.error || "Upload failed");
    }
    return j.data?.url;
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    const newUrls = [];
    try {
      for (const file of toUpload) {
        const url = await uploadFile(file);
        if (url) newUrls.push(url);
      }
      if (newUrls.length) {
        onChange([...value, ...newUrls]);
        toast.success(newUrls.length > 1 ? `${newUrls.length} images uploaded` : "Image uploaded");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
    setUploading(false);
    if (ref.current) ref.current.value = "";
  }

  function removeAt(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(from, to) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== i) move(dragIdx, i);
              setDragIdx(null);
            }}
            onDragEnd={() => setDragIdx(null)}
            className={cn(
              "group relative h-24 w-24 overflow-hidden rounded-lg border bg-muted shadow-sm transition hover:border-primary/40",
              dragIdx === i && "opacity-60"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(url)} alt="" className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Main
              </span>
            ) : null}
            <button
              type="button"
              className="absolute right-1 top-1 rounded bg-background/90 p-1 opacity-0 shadow transition group-hover:opacity-100"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
            <span className="absolute bottom-1 left-1 rounded bg-background/80 p-0.5 opacity-0 transition group-hover:opacity-100">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          </div>
        ))}

        {value.length < maxImages ? (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary/30 bg-muted/50 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted"
          >
            <Upload className="h-5 w-5" />
            {uploading ? "Uploading…" : "Add"}
          </button>
        ) : null}
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => ref.current?.click()}
          disabled={uploading || value.length >= maxImages}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading…" : "Upload images"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP or GIF. First image is the main thumbnail. Drag to reorder.
        </p>
      </div>
    </div>
  );
}
