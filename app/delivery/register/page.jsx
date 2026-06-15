"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    county: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/delivery-companies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Registration failed");
        return;
      }
      toast.success("Registration submitted for Markay Hall verification");
      router.push("/delivery/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register delivery company</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            {["name", "email", "password", "phone", "city", "county"].map((field) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize">{field}</Label>
                <Input
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  required={field !== "phone" && field !== "county"}
                  value={values[field]}
                  onChange={(e) => setValues({ ...values, [field]: e.target.value })}
                />
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/delivery/login" className="text-primary hover:underline">
              Already registered? Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
