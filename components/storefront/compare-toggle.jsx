"use client";

import { Scale } from "lucide-react";
import { toast } from "sonner";
import { useCompareStore, COMPARE_MAX } from "@/store/compare-store";
import { trackInteraction } from "@/lib/analytics/track-client";

/**
 * @param {{ productId: string; productName?: string; className?: string; size?: "sm" | "md" }} props
 */
export function CompareToggle({ productId, productName = "Product", className = "", size = "sm" }) {
  const ids = useCompareStore((s) => s.ids);
  const toggle = useCompareStore((s) => s.toggle);
  const isOn = ids.includes(productId);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const res = toggle(productId);
    if (res?.full) {
      toast.error(`You can compare up to ${COMPARE_MAX} products`);
      return;
    }
    if (res?.added) {
      toast.success(`${productName} added to compare`);
      trackInteraction({
        eventType: "compare_add",
        productId,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
    } else {
      toast(`${productName} removed from compare`);
    }
  }

  const dim = size === "md" ? "h-9 px-3 text-sm" : "h-8 px-2 text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOn}
      className={`inline-flex items-center gap-1.5 rounded-md border transition ${
        isOn
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/15 bg-card text-foreground hover:bg-muted"
      } ${dim} ${className}`}
    >
      <Scale className="h-3.5 w-3.5" />
      {isOn ? "Comparing" : "Compare"}
    </button>
  );
}
