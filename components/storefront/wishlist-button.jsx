"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ productId: string; initiallySaved: boolean; isLoggedIn: boolean }} props
 */
export function WishlistButton({ productId, initiallySaved, isLoggedIn }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/customer/wishlist?productId=${productId}`, { method: "DELETE" });
        const j = await res.json();
        if (j.success) {
          setSaved(false);
          toast.success("Removed from wishlist");
        } else {
          toast.error(j.error || "Could not update");
        }
      } else {
        const res = await fetch("/api/customer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const j = await res.json();
        if (j.success) {
          setSaved(true);
          toast.success("Added to wishlist");
        } else {
          toast.error(j.error || "Could not update");
        }
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <Button type="button" variant={saved ? "secondary" : "outline"} disabled={loading} onClick={toggle}>
      {saved ? "♥ In wishlist" : "♡ Add to wishlist"}
    </Button>
  );
}
