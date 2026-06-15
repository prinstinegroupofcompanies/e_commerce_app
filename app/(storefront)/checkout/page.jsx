import { CheckoutWizard } from "@/components/storefront/checkout-wizard";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <CheckoutWizard />
    </div>
  );
}
