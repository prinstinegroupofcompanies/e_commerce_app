"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminIntegrationTests() {
  const [phone, setPhone] = useState("+231");
  const [busy, setBusy] = useState(false);

  async function testSms(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed");
        return;
      }
      if (json.data?.sent) toast.success("SMS sent via Twilio");
      else toast.message(json.data?.hint || "SMS logged (Twilio not configured)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={testSms} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Test Twilio SMS</h3>
      <p className="text-sm text-muted-foreground">Use a Liberia number (+231…) or your Twilio-verified trial number.</p>
      <div className="space-y-2">
        <Label htmlFor="test-phone">Phone</Label>
        <Input id="test-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send test SMS"}
      </Button>
    </form>
  );
}
