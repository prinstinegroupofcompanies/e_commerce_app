import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";
import { PaymentMethodCreateForm } from "@/components/admin/payment-method-create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payment methods" };

export default async function AdminPaymentMethodsPage() {
  await auth();
  const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment methods</h1>
          <p className="text-sm text-muted-foreground">Enable payment gateways available to customers.</p>
        </div>
        <PaymentMethodCreateForm />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Display name</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No payment methods configured.
                </TableCell>
              </TableRow>
            ) : (
              methods.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.name}</TableCell>
                  <TableCell>{m.displayName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.isSandbox ? "Sandbox" : "Live"}</Badge>
                  </TableCell>
                  <TableCell>
                    {m.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <SimpleToggleButton
                        endpoint={`/api/admin/payment-methods/${m.id}`}
                        field="isActive"
                        value={m.isActive}
                        labelOn="Disable"
                        labelOff="Enable"
                      />
                      <SimpleToggleButton
                        endpoint={`/api/admin/payment-methods/${m.id}`}
                        field="isSandbox"
                        value={m.isSandbox}
                        labelOn="Go live"
                        labelOff="Sandbox"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
