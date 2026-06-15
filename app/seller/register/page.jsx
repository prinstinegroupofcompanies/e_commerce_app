import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SITE_NAME } from "@/lib/brand";
import { SellerRegisterForm } from "@/components/seller/seller-register-form";

export const metadata = { title: "Become a seller" };

export default function SellerRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/[0.06] via-background to-accent/[0.08] px-4 py-12">
      <BrandLogo href="/" size="lg" priority className="mb-8" />
      <Card className="w-full max-w-lg border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle>Create your shop</CardTitle>
          <CardDescription>Open a storefront on {SITE_NAME} and start selling.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellerRegisterForm />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/seller/login" className="underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
