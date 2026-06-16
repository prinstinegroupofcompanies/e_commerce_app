"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Save, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { slugify } from "@/lib/slug";

/**
 * @param {{
 *   mode: "create" | "edit";
 *   post?: {
 *     id: string;
 *     title: string;
 *     slug: string;
 *     excerpt: string | null;
 *     content: string | null;
 *     thumbnail: string | null;
 *     categoryId: string | null;
 *     isPublished: boolean;
 *     metaTitle: string | null;
 *     metaDesc: string | null;
 *   };
 *   categories: { id: string; name: string }[];
 * }} props
 */
export function BlogPostEditor({ mode, post, categories }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    thumbnail: post?.thumbnail ?? "",
    categoryId: post?.categoryId ?? "",
    isPublished: post?.isPublished ?? false,
    metaTitle: post?.metaTitle ?? "",
    metaDesc: post?.metaDesc ?? "",
  });

  async function save(publish) {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      thumbnail: form.thumbnail || null,
      categoryId: form.categoryId || null,
      isPublished: publish ?? form.isPublished,
      metaTitle: form.metaTitle.trim() || null,
      metaDesc: form.metaDesc.trim() || null,
    };

    try {
      const res =
        mode === "create"
          ? await fetch("/api/admin/blog/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/blog/posts/${post.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Save failed");
      } else {
        toast.success(publish ? "Published" : "Saved");
        if (mode === "create") {
          router.push(`/admin/blog/posts/${json.data.id}/edit`);
        } else {
          router.refresh();
        }
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function remove() {
    if (!post || !confirm("Delete this post permanently?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/posts/${post.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) toast.error(json.error || "Delete failed");
      else {
        toast.success("Post deleted");
        router.push("/admin/blog/posts");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  const previewSlug = form.slug.trim() || slugify(form.title) || "preview";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/admin/blog/posts">← All posts</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {mode === "edit" && form.isPublished ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={`/blog/${previewSlug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View live
              </a>
            </Button>
          ) : null}
          {mode === "edit" ? (
            <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={saving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => save(false)} disabled={saving}>
            Save draft
          </Button>
          <Button type="button" onClick={() => save(true)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder={slugify(form.title) || "auto-from-title"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <textarea
                  id="excerpt"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  rows={14}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Write your article (HTML supported)…"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Featured image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={form.thumbnail || null}
                onChange={(url) => setForm((f) => ({ ...f, thumbnail: url || "" }))}
                folder="uploads/blog"
                label="Upload thumbnail"
                shape="square"
                size={120}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="rounded border-input"
                />
                Published on storefront
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta title</Label>
                <Input
                  id="metaTitle"
                  value={form.metaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDesc">Meta description</Label>
                <textarea
                  id="metaDesc"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.metaDesc}
                  onChange={(e) => setForm((f) => ({ ...f, metaDesc: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
