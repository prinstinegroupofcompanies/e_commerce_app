"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function SellerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType: "seller" }),
      });
      setDone(true);
    } catch {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/[0.06] via-background to-accent/[0.08] p-4">
      <BrandLogo href="/" size="lg" priority className="mb-8" />
      <Card className="w-full max-w-md border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle>Reset your seller password</CardTitle>
          <CardDescription>
            Enter the email on your seller account and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-sm">
              <p>
                If a seller account exists for <span className="font-medium">{email}</span>, a reset
                link is on the way. Check your inbox (and the spam folder).
              </p>
              <p className="text-muted-foreground">Reset links expire in 1 hour.</p>
              <div className="pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/seller/login">Back to sign in</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Remembered it?{" "}
                <Link href="/seller/login" className="underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
