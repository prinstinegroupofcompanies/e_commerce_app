import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderInvoice } from "@/components/orders/order-invoice";
import { PrintActions } from "@/components/orders/print-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = params;
  const session = await auth();
  const customerId = session?.user?.id;
  if (!customerId) return { title: "Invoice" };
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    select: { code: true },
  });
  return { title: order ? `Invoice ${order.code}` : "Invoice" };
}

export default async function CustomerInvoicePage({ params }) {
  const session = await auth();
  const customerId = session?.user?.id;
  if (!customerId) redirect("/login");

  const { id } = params;
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      customer: { select: { email: true, name: true } },
      items: {
        include: {
          seller: { select: { shopName: true } },
        },
      },
    },
  });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-8 print:bg-white print:py-0">
      <PrintActions backHref={`/dashboard/orders/${order.id}`} backLabel="Back to order" />
      <OrderInvoice order={order} />
    </main>
  );
}
