"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { credentialSignIn } from "@/hooks/use-credential-sign-in";

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const res = await credentialSignIn("delivery-login", {
      email,
      password,
      callbackUrl: "/delivery/dashboard",
    });
    if (!res.ok) {
      setBusy(false);
      toast.error("Invalid credentials or account not yet approved");
    }
  }

  return (
    <AuthShell portal="delivery">
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Company email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <PasswordInput
              id="password"
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="h-11 w-full text-base" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            <Link href="/delivery/register" className="font-semibold text-primary hover:underline">
              Register your delivery company
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
