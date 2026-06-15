"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackInteraction } from "@/lib/analytics/track-client";

/**
 * @param {{ productId: string; canReview: boolean; isLoggedIn: boolean }} props
 */
export function ProductReviewForm({ productId, canReview, isLoggedIn }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <a className="text-primary hover:underline" href="/login">Sign in</a> to share a review.
      </p>
    );
  }

  if (!canReview) {
    return (
      <p className="text-sm text-muted-foreground">
        You can review this product after a completed purchase.
      </p>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title || null, body: body || null }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error || "Could not submit");
      } else {
        toast.success("Thanks! Your review is awaiting moderation.");
        trackInteraction({
          eventType: "review",
          productId,
          metadata: { rating },
        });
        setTitle("");
        setBody("");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <form className="space-y-3 rounded-lg border p-4" onSubmit={submit}>
      <h3 className="text-sm font-semibold">Write a review</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="text-2xl leading-none"
          >
            <span className={n <= rating ? "text-amber-500" : "text-muted-foreground/40"}>★</span>
          </button>
        ))}
      </div>
      <div className="space-y-1">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="review-body">Comment</Label>
        <textarea
          id="review-body"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
