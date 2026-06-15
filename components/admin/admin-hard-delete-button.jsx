"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * @param {{ apiPath: string; disabled?: boolean }} props
 */
export function AdminHardDeleteButton({ apiPath, disabled }) {
  const router = useRouter();

  async function onClick() {
    if (!window.confirm("Permanently delete this attribute and all its values?")) return;
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Could not delete");
        return;
      }
      toast.success("Deleted");
      router.push("/admin/attributes");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={disabled} onClick={onClick}>
      Delete
    </Button>
  );
}
