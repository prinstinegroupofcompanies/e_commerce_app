"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** @param {{ reviewId: string; isApproved: boolean }} props */
export function AdminReviewActions({ reviewId, isApproved }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(data) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Update failed");
        setLoading(false);
        return;
      }
      toast.success("Review updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="flex justify-end gap-2">
      {!isApproved ? (
        <Button size="sm" disabled={loading} onClick={() => patch({ isApproved: true })}>
          Approve
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={loading} onClick={() => patch({ isApproved: false })}>
          Unapprove
        </Button>
      )}
    </div>
  );
}
