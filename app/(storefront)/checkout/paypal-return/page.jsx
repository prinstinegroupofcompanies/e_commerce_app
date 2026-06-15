"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

function PayPalReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  const token = searchParams.get("token");
  const orderCode = searchParams.get("code");

  useEffect(() => {
    if (!token) {
      setError("Missing PayPal session. If you cancelled payment, you can try checkout again.");
      return;
    }

    let cancelled = false;

    async function capture() {
      const res = await fetch("/api/payments/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalOrderId: token, orderCode: orderCode || undefined }),
      });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok || !json.success) {
        setError(json.error || "Could not confirm PayPal payment");
        return;
      }
      clearCart();
      const c = json.data?.code || orderCode || "";
      setCode(c);
      router.replace(`/order-success?code=${encodeURIComponent(c)}`);
    }

    capture();
    return () => {
      cancelled = true;
    };
  }, [token, orderCode, clearCart, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="mt-4 text-muted-foreground">Confirming your PayPal payment…</p>
      {code ? <p className="mt-2 font-mono text-sm">{code}</p> : null}
    </div>
  );
}

export default function PayPalReturnPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted-foreground">Loading…</p>}>
      <PayPalReturnContent />
    </Suspense>
  );
}
