import { AuthBrandPanel } from "@/components/brand/auth-brand-panel";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/[0.06] via-background to-accent/[0.08] px-4 py-12">
      <AuthBrandPanel />
      {children}
    </div>
  );
}
