"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ productId: string; disabled?: boolean }} props
 */
export function ProductDeactivateButton({ productId, disabled }) {
  const router = useRouter();

  async function onDeactivate() {
    if (!window.confirm("Deactivate this product? It will be hidden from the storefront.")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not deactivate");
        return;
      }
      toast.success("Product deactivated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onDeactivate}>
      Deactivate
    </Button>
  );
}
