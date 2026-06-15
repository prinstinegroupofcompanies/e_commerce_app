"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(/** @type {null | "ok" | "error"} */ (null));
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("ok");
        setMessage(json.data.alreadySubscribed ? "You're already on the list — thanks!" : "Subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.error || "Could not subscribe");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
    setLoading(false);
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:flex-1"
          aria-label="Email"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "…" : "Subscribe"}
        </Button>
      </div>
      {status === "ok" ? (
        <p className="text-xs text-emerald-600">{message}</p>
      ) : status === "error" ? (
        <p className="text-xs text-destructive">{message}</p>
      ) : null}
    </form>
  );
}
