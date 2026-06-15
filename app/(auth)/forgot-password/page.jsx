"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
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
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <AuthShell portal="customer">
      <Card className="border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Reset your password</CardTitle>
          <CardDescription>We&apos;ll email you a secure link to choose a new password</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-sm">
              <p>
                If an account exists for <span className="font-medium">{email}</span>, a reset link is
                on the way. Check your inbox (and spam folder).
              </p>
              <p className="text-muted-foreground">Reset links expire in 1 hour.</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@markayhall.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="hover:text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
