import { CompareView } from "@/components/storefront/compare-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compare products",
  description: "Side-by-side comparison of products you saved.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Compare products</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Compare up to 4 products side-by-side. Add products to compare from any product card or product page.
        </p>
      </div>
      <CompareView />
    </div>
  );
}
