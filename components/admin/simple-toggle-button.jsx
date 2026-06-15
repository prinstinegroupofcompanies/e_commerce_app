"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * @param {{
 *   endpoint: string;  // e.g. /api/admin/payment-methods/abc
 *   field: string;
 *   value: boolean;
 *   labelOn?: string;
 *   labelOff?: string;
 * }} props
 */
export function SimpleToggleButton({ endpoint, field, value, labelOn = "Disable", labelOff = "Enable" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !value }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Update failed");
        setLoading(false);
        return;
      }
      toast.success("Updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={toggle}>
      {value ? labelOn : labelOff}
    </Button>
  );
}
