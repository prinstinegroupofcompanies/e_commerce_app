"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getVisitorKey } from "@/lib/analytics/track-client";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "—";
  const deliveryPin = searchParams.get("pin");
  const redirectStatus = searchParams.get("redirect_status");
  const paymentIntent = searchParams.get("payment_intent");

  const [paymentNote, setPaymentNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!code || code === "—") return;
    const vk = getVisitorKey();
    if (!vk) return;
    fetch("/api/analytics/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-Key": vk,
      },
      credentials: "same-origin",
      body: JSON.stringify({ orderCode: code }),
    }).catch(() => {});
  }, [code]);

  useEffect(() => {
    if (!paymentIntent || !code || code === "—") return;

    let cancelled = false;
    setConfirming(true);

    fetch("/api/payments/stripe/confirm-return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: paymentIntent, orderCode: code }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data?.status === "paid") {
          setPaymentNote("Card payment received — thank you.");
        } else if (redirectStatus === "failed") {
          setPaymentNote("Card payment did not complete. You can track the order or contact support.");
        } else if (json.data?.status === "processing") {
          setPaymentNote("Payment is processing. We will update your order shortly.");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setConfirming(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentIntent, code, redirectStatus]);

  const failed = redirectStatus === "failed";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:py-20">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          failed ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {failed ? <AlertCircle className="h-9 w-9" aria-hidden /> : <CheckCircle2 className="h-9 w-9" aria-hidden />}
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight md:text-3xl">
        {failed ? "Order placed — payment incomplete" : "Thank you for your order"}
      </h1>
      <p className="mt-3 text-pretty text-sm text-muted-foreground md:text-base">
        {failed
          ? "Your order was created but card payment did not go through. Use track order to check status or try again."
          : "We have received your order. You will get a confirmation email when fulfillment begins."}
      </p>
      {confirming ? (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Confirming payment…
        </p>
      ) : paymentNote ? (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">{paymentNote}</p>
      ) : null}
      <Card className="mt-8 border-border/80 text-left shadow-sm">
        <CardContent className="flex items-start gap-4 p-5 sm:p-6">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order code</p>
            <p className="mt-1 break-all font-mono text-lg font-semibold tracking-tight text-foreground">{code}</p>
            <p className="mt-2 text-xs text-muted-foreground">Save this code for your records and support requests.</p>
            {deliveryPin ? (
              <p className="mt-3 text-sm">
                <span className="font-medium text-foreground">Delivery PIN: </span>
                <span className="font-mono font-semibold">{deliveryPin}</span>
                <span className="block text-xs text-muted-foreground">Use this PIN to confirm delivery when your order arrives.</span>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" asChild>
          <Link href={`/track-order?code=${encodeURIComponent(code)}`}>Track this order</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export function OrderSuccessClient() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted-foreground">Loading…</p>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
