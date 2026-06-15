import { CustomerReviewsList } from "@/components/customer/customer-reviews-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "My reviews" };

export default function CustomerReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My reviews</h1>
        <p className="text-sm text-muted-foreground">Feedback you have shared on purchased items.</p>
      </div>
      <CustomerReviewsList />
    </div>
  );
}
