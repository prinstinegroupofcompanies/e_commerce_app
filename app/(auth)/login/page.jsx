"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { credentialSignIn } from "@/hooks/use-credential-sign-in";

function CustomerLoginForm() {
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
    const res = await credentialSignIn("customer-login", { email, password, callbackUrl });
    if (!res.ok) {
      setLoading(false);
      setError("Invalid email or password, or your email is not verified yet.");
    }
  }

  return (
    <AuthShell portal="customer">
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="customer@markayhall.com"
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
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  verified === "1" ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"
                }`}
              >
                {verifyBanner}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button className="h-11 w-full text-base" type="submit" disabled={loading}>
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
          <div className="mt-6 flex flex-col gap-2 border-t pt-4 text-center text-sm text-muted-foreground">
            <p>
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              <Link href="/forgot-password" className="hover:text-foreground hover:underline">
                Forgot your password?
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
