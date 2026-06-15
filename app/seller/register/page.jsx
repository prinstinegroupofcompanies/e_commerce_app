import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { SellerRegisterForm } from "@/components/seller/seller-register-form";

export const metadata = { title: "Become a seller" };

export default function SellerRegisterPage() {
  return (
    <AuthShell portal="seller">
      <Card className="w-full border-0 bg-white/95 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <SellerRegisterForm />
          <p className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/seller/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
