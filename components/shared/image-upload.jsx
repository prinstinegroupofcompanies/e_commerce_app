"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/upload-url";

/**
 * Uploads an image to /api/upload and returns the stored URL via onChange.
 *
 * @param {{
 *   value?: string | null;
 *   onChange: (url: string | null) => void;
 *   folder?: string;
 *   label?: string;
 *   accept?: string;
 *   shape?: "circle" | "square";
 *   size?: number;
 * }} props
 */
export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  label = "Upload image",
  accept = "image/png,image/jpeg,image/webp,image/gif",
  shape = "circle",
  size = 80,
}) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body });
      const j = await res.json();
      if (!res.ok || !j.success) {
        toast.error(j.error || "Upload failed");
      } else {
        onChange(j.data?.url || null);
        toast.success("Uploaded");
      }
    } catch {
      toast.error("Network error");
    }
    setUploading(false);
    if (ref.current) ref.current.value = "";
  }

  const dimStyle = { width: `${size}px`, height: `${size}px` };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-primary/15 bg-muted ${
          shape === "circle" ? "rounded-full" : "rounded-md"
        }`}
        style={dimStyle}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveMediaUrl(value)} alt="" className="h-full w-full object-cover" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={ref}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => ref.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : label}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF up to 4MB.</p>
      </div>
    </div>
  );
}
