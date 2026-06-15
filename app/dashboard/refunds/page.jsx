import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerRefundsManager } from "@/components/customer/customer-refunds-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Refunds" };

export default async function CustomerRefundsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, code: true, total: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
        <p className="mt-1 text-sm text-muted-foreground">Request a refund for a past order.</p>
      </div>
      <CustomerRefundsManager orders={orders} />
    </div>
  );
}
