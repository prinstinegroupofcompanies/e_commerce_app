"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ apiPath: string; disabled?: boolean; children?: import("react").ReactNode }} props
 */
export function AdminCatalogDeactivateButton({ apiPath, disabled, children }) {
  const router = useRouter();

  async function onClick() {
    if (!window.confirm("Deactivate this record?")) return;
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not deactivate");
        return;
      }
      toast.success("Deactivated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick}>
      {children ?? "Deactivate"}
    </Button>
  );
}
