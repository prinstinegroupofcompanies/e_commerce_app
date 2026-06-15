import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Flash deals" };

export default async function AdminFlashDealsPage() {
  await auth();
  const deals = await prisma.flashDeal.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flash deals</h1>
          <p className="text-sm text-muted-foreground">Schedule time-bound sales with discounted items.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/flash-deals"
          triggerLabel="New flash deal"
          fields={[
            { key: "title", label: "Title", required: true, placeholder: "Black Friday" },
            { key: "startsAt", label: "Starts", required: true, placeholder: "2026-11-25" },
            { key: "endsAt", label: "Ends", required: true, placeholder: "2026-11-28" },
            { key: "banner", label: "Banner URL", type: "url", emptyAsNull: true },
          ]}
          payloadDefaults={{ isActive: true }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No flash deals yet.</TableCell>
              </TableRow>
            ) : (
              deals.map((d) => {
                const live = d.isActive && d.startsAt.getTime() <= now && d.endsAt.getTime() >= now;
                const upcoming = d.startsAt.getTime() > now;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.startsAt.toLocaleDateString()} → {d.endsAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{d._count.items}</TableCell>
                    <TableCell>
                      {!d.isActive ? (
                        <Badge variant="outline">Disabled</Badge>
                      ) : live ? (
                        <Badge variant="secondary">Live</Badge>
                      ) : upcoming ? (
                        <Badge variant="outline">Upcoming</Badge>
                      ) : (
                        <Badge variant="outline">Ended</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <SimpleToggleButton
                        endpoint={`/api/admin/flash-deals/${d.id}`}
                        field="isActive"
                        value={d.isActive}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
