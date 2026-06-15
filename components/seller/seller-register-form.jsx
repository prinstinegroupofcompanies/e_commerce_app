"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerRegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    shopCity: "",
    shopCountry: "Liberia",
    shopCounty: "",
    businessCategory: "",
    businessLicense: "",
  });
  const [saving, setSaving] = useState(false);

  function setField(k, v) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sellers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not register");
        setSaving(false);
        return;
      }
      toast.success("Registration submitted — Markay Hall will verify your store");
      router.push("/seller/login?pending=1");
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" required value={values.name} onChange={(e) => setField("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={values.phone} onChange={(e) => setField("phone", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input
          id="shopName"
          required
          value={values.shopName}
          onChange={(e) => setField("shopName", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessCategory">Business category</Label>
        <Input
          id="businessCategory"
          placeholder="Retail, Fashion, Electronics…"
          value={values.businessCategory}
          onChange={(e) => setField("businessCategory", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shopCity">City</Label>
          <Input id="shopCity" value={values.shopCity} onChange={(e) => setField("shopCity", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shopCounty">County</Label>
          <Input id="shopCounty" value={values.shopCounty} onChange={(e) => setField("shopCounty", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopCountry">Country</Label>
        <Input
          id="shopCountry"
          value={values.shopCountry}
          onChange={(e) => setField("shopCountry", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessLicense">Business license (optional)</Label>
        <Input
          id="businessLicense"
          placeholder="License number or document reference"
          value={values.businessLicense}
          onChange={(e) => setField("businessLicense", e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Creating shop…" : "Create shop"}
      </Button>
    </form>
  );
}
