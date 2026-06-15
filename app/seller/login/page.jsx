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

function SellerLoginFormInner() {
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
    const res = await credentialSignIn("seller-login", { email, password, callbackUrl });
    if (!res.ok) {
      setLoading(false);
      setError("Invalid credentials or your store is still pending approval.");
    }
  }

  return (
    <AuthShell portal="seller">
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          {pending === "1" ? (
            <p className="mb-4 rounded-lg bg-accent/25 px-3 py-2 text-sm">
              Registration received. Sign in once Markay Hall approves your store.
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
                "Sign in to seller portal"
              )}
            </Button>
            <p className="text-center text-sm">
              <Link href="/seller/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
          <p className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            New seller?{" "}
            <Link href="/seller/register" className="font-semibold text-primary hover:underline">
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
