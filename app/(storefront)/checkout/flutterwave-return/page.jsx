"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ReturnContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");
  const transactionId = searchParams.get("transaction_id");
  const [message, setMessage] = useState("Confirming payment…");
  const [ok, setOk] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    if (!txRef) {
      setMessage("Missing payment reference.");
      return;
    }
    fetch("/api/payments/flutterwave/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txRef, transactionId, status }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.confirmed) {
          setOk(true);
          setOrderCode(json.data.orderCode || "");
          setMessage("Payment received. Thank you!");
        } else {
          setMessage(json.error || "Payment not confirmed yet. Contact support if you were charged.");
        }
      })
      .catch(() => setMessage("Could not verify payment."));
  }, [txRef, transactionId, status]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {!ok && message.startsWith("Confirming") ? (
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      ) : null}
      <h1 className="mt-6 text-2xl font-bold">{ok ? "Payment successful" : "Payment status"}</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      {orderCode ? (
        <p className="mt-2 font-mono text-sm">
          Order: <span className="font-semibold">{orderCode}</span>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {orderCode ? (
          <Button asChild>
            <Link href={`/track-order?code=${encodeURIComponent(orderCode)}`}>Track order</Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

export default function FlutterwaveReturnPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center">Loading…</p>}>
      <ReturnContent />
    </Suspense>
  );
}
