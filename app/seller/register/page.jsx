import Link from "next/link";
import { Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SITE_NAME } from "@/lib/brand";
import { SellerRegisterForm } from "@/components/seller/seller-register-form";

export const metadata = { title: "Become a seller" };

export default function SellerRegisterPage() {
  return (
    <AuthShell portal="seller">
      <Card className="w-full max-w-lg border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create your shop</CardTitle>
          <CardDescription>Open a storefront on {SITE_NAME} and start selling across Liberia</CardDescription>
        </CardHeader>
        <CardContent>
          <SellerRegisterForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/seller/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
