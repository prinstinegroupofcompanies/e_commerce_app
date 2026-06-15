import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pickup points" };

export default async function AdminPickupPointsPage() {
  await auth();
  const points = await prisma.pickupPoint.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pickup points</h1>
          <p className="text-sm text-muted-foreground">Physical locations customers can choose at checkout.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/shipping/pickup-points"
          triggerLabel="Add pickup point"
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "address", label: "Address", required: true },
            { key: "city", label: "City", required: true },
            { key: "country", label: "Country", required: true },
            { key: "phone", label: "Phone", emptyAsNull: true },
            { key: "hours", label: "Hours", emptyAsNull: true },
          ]}
          payloadDefaults={{ isActive: true }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No pickup points yet.</TableCell>
              </TableRow>
            ) : (
              points.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm">
                    {p.address}
                    <div className="text-xs text-muted-foreground">{p.city}, {p.country}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.phone || "—"}
                    {p.hours ? <div className="text-xs text-muted-foreground">{p.hours}</div> : null}
                  </TableCell>
                  <TableCell>
                    {p.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <SimpleToggleButton
                      endpoint={`/api/admin/shipping/pickup-points/${p.id}`}
                      field="isActive"
                      value={p.isActive}
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
