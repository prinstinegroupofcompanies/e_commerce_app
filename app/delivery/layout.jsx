import { DeliveryShell } from "@/components/delivery/delivery-shell";
import { createSectionMetadata } from "@/lib/site-metadata";

export const metadata = createSectionMetadata("Delivery", "Markay Hall delivery partner portal");

export default function DeliveryLayout({ children }) {
  return <DeliveryShell>{children}</DeliveryShell>;
}
