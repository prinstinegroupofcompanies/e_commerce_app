"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { SITE_NAME } from "@/lib/brand";

function SellerLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/seller/dashboard";
  const pending = searchParams.get("pending");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("seller-login", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or your store is still pending approval.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell portal="seller">
      <Card className="border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Seller sign in</CardTitle>
          <CardDescription>Manage your {SITE_NAME} shop and orders</CardDescription>
        </CardHeader>
        <CardContent>
          {pending === "1" ? (
            <p className="mb-4 rounded-md bg-accent/20 px-3 py-2 text-sm text-foreground">
              Registration received. You can sign in once Markay Hall approves your store.
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Seller email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seller@markayhall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <PasswordInput
              id="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
                "Sign in to seller portal"
              )}
            </Button>
            <p className="text-center text-sm">
              <Link href="/seller/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New seller?{" "}
            <Link href="/seller/register" className="font-medium text-primary hover:underline">
              Register your store
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function SellerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SellerLoginFormInner />
    </Suspense>
  );
}
