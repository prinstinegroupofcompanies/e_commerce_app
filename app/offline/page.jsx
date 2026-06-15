import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata = { title: "You are offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <BrandLogo href="/" size="lg" className="mb-6" />
      <WifiOff className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">You are offline</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Check your connection and try again. Previously visited pages may still be available from cache.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
