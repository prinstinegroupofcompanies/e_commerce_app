import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Taxes" };

export default async function AdminTaxesPage() {
  await auth();
  const profiles = await prisma.taxProfile.findMany({
    orderBy: { name: "asc" },
    include: { rates: { orderBy: [{ country: "asc" }, { state: "asc" }] }, _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax profiles</h1>
          <p className="text-sm text-muted-foreground">Define regional VAT/GST/sales tax to apply to product groups.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/taxes"
          triggerLabel="New profile"
          fields={[{ key: "name", label: "Name", required: true, placeholder: "Standard rate" }]}
        />
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No tax profiles yet.</CardContent>
        </Card>
      ) : (
        profiles.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <span className="text-xs text-muted-foreground">{p._count.products} product(s)</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>State / region</TableHead>
                    <TableHead className="text-right">Rate (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.rates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No rates yet.</TableCell>
                    </TableRow>
                  ) : (
                    p.rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.country || "—"}</TableCell>
                        <TableCell>{r.state || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.rate.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <InlineCreateForm
                endpoint="/api/admin/taxes/rates"
                triggerLabel="Add rate"
                extra={{ profileId: p.id }}
                fields={[
                  { key: "country", label: "Country", emptyAsNull: true },
                  { key: "state", label: "State / region", emptyAsNull: true },
                  { key: "rate", label: "Rate (%)", type: "number", required: true, defaultValue: "0" },
                ]}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
