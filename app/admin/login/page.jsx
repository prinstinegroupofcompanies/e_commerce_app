import { Suspense } from "react";
import { AdminLoginForm } from "./admin-login-form";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
