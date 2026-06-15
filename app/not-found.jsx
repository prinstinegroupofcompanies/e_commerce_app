import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <BrandLogo href="/" size="lg" className="mb-6" />
        <p className="text-7xl font-extrabold tracking-tight text-primary sm:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">
              <Search className="mr-2 h-4 w-4" />
              Browse products
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/track-order">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Track an order
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
