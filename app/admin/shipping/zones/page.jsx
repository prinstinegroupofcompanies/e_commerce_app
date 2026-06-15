import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shipping zones" };

export default async function AdminShippingZonesPage() {
  await auth();
  const zones = await prisma.shippingZone.findMany({
    orderBy: { name: "asc" },
    include: { profile: { select: { name: true } }, _count: { select: { rates: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipping zones</h1>
          <p className="text-sm text-muted-foreground">Defined under profiles — manage rates from the profile view.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/shipping/methods">Manage profiles</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Countries</TableHead>
              <TableHead className="text-right">Rates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No zones yet.</TableCell>
              </TableRow>
            ) : (
              zones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell>{z.profile?.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">{z.countries}</TableCell>
                  <TableCell className="text-right tabular-nums">{z._count.rates}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
