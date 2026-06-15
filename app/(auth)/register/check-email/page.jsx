"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";

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
    <AuthShell portal="register" showPortalLinks={false}>
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="space-y-4 pt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            We sent a verification link{email ? ` to ${email}` : ""}. Click the link to activate your account, then
            sign in.
          </p>
          {email ? (
            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={resend}>
              {loading ? "Sending…" : sent ? "Email sent again" : "Resend verification email"}
            </Button>
          ) : null}
          <Button asChild className="h-11 w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
