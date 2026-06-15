"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verified = searchParams.get("verified");
  const verify = searchParams.get("verify");
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("111111");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyBanner =
    verified === "1"
      ? "Email verified. You can sign in now."
      : verify === "invalid"
        ? "Verification link is invalid or expired."
        : verify === "missing"
          ? "Missing verification token."
          : null;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("customer-login", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or email not verified yet.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>Use your customer account to track orders and wallet.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {verifyBanner ? (
            <p className={`text-sm ${verified === "1" ? "text-green-700" : "text-destructive"}`}>{verifyBanner}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/register" className="text-primary hover:underline">
            Create an account
          </Link>
          {" · "}
          <Link href="/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Demo: customer@example.com / 111111
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CustomerLoginForm />
    </Suspense>
  );
}
