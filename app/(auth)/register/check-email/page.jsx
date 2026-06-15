"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a verification link{email ? ` to ${email}` : ""}. Click the link to activate your account, then sign
          in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {email ? (
          <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={resend}>
            {loading ? "Sending…" : sent ? "Email sent again" : "Resend verification email"}
          </Button>
        ) : null}
        <Button asChild className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CheckEmailContent />
    </Suspense>
  );
}
