"use client";

import { useState } from "react";
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

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await credentialSignIn("admin-login", { email, password, callbackUrl });
    if (!res.ok) {
      setLoading(false);
      setError("Invalid administrator email or password.");
    }
  }

  return (
    <AuthShell portal="admin">
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Admin email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@markayhall.com"
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
                "Sign in to admin"
              )}
            </Button>
          </form>
          <p className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Customer sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
