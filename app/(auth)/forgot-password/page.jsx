"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="w-full max-w-md border-primary/10 shadow-lg">
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a link to set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="space-y-3 text-sm">
            <p>
              If an account exists for <span className="font-medium">{email}</span>, a reset link is
              on the way. Check your inbox (and the spam folder).
            </p>
            <p className="text-muted-foreground">Reset links expire in 1 hour.</p>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Back to sign in</Link>
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
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
