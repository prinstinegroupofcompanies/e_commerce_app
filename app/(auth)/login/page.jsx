"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verified = searchParams.get("verified");
  const verify = searchParams.get("verify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Invalid email or password, or your email is not verified yet.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell portal="customer">
      <Card className="border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>Sign in to your customer account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@markayhall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <PasswordInput
              id="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {verifyBanner ? (
              <p className={`rounded-md px-3 py-2 text-sm ${verified === "1" ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"}`}>
                {verifyBanner}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
              <span className="mx-2 text-border">|</span>
              <Link href="/forgot-password" className="hover:text-foreground hover:underline">
                Forgot password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
