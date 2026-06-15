import { SITE_NAME } from "@/lib/brand";
import { TrackOrderForm } from "@/components/storefront/track-order-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track order",
  description: `Look up an order placed at ${SITE_NAME} using the order code and the email used at checkout.`,
};

export default function TrackOrderPage({ searchParams }) {
  const code = searchParams?.code?.toString() || "";
  const email = searchParams?.email?.toString() || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-accent">{SITE_NAME}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the order code shown on your receipt and the email used at checkout.
        </p>
      </header>
      <TrackOrderForm defaultCode={code} defaultEmail={email} />
    </div>
  );
}
