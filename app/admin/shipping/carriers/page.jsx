import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shipping carriers" };

export default async function AdminCarriersPage() {
  await auth();
  const carriers = await prisma.shippingCarrier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipping carriers</h1>
          <p className="text-sm text-muted-foreground">Carriers shown on order detail and tracking links.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/shipping/carriers"
          triggerLabel="Add carrier"
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "DHL" },
            { key: "trackingUrl", label: "Tracking URL", type: "url", placeholder: "https://…/track?id={id}", emptyAsNull: true },
          ]}
          payloadDefaults={{ isActive: true }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tracking URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No carriers yet.</TableCell>
              </TableRow>
            ) : (
              carriers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">{c.trackingUrl || "—"}</TableCell>
                  <TableCell>
                    {c.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <SimpleToggleButton
                      endpoint={`/api/admin/shipping/carriers/${c.id}`}
                      field="isActive"
                      value={c.isActive}
                    />
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
