import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { AdminDeliveryVerify } from "@/components/admin/admin-delivery-verify";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryCompaniesPage() {
  await auth();

  const companies = await prisma.deliveryCompany.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verify logistics partners for Markay Hall checkout.</p>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.city}, {c.county}</div>
                </TableCell>
                <TableCell className="text-sm">{c.email}</TableCell>
                <TableCell className="text-sm tabular-nums">
                  ${c.standardFee} / ${c.expressFee}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {c.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.verificationStatus === "pending" ? (
                    <AdminDeliveryVerify companyId={c.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
