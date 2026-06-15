"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing or invalid reset link");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Could not reset password");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <AuthShell portal="customer" showPortalLinks={false}>
      <Card className="border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          {done ? (
            <p className="text-center text-sm text-emerald-600">Password updated. Redirecting to sign in…</p>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <PasswordInput
                id="password"
                label="New password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                id="confirm"
                label="Confirm password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="h-11 w-full" disabled={loading || !token}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Set new password"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/forgot-password" className="underline">
                  Need a new link?
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
