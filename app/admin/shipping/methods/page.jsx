import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Delivery profiles" };

export default async function AdminShippingProfilesPage() {
  await auth();
  const profiles = await prisma.shippingProfile.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      zones: { include: { rates: true } },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery profiles</h1>
          <p className="text-sm text-muted-foreground">Group rates by region and product type.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/shipping/profiles"
          triggerLabel="Add profile"
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "Standard" },
          ]}
          payloadDefaults={{ isDefault: false }}
        />
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No delivery profiles yet.
          </CardContent>
        </Card>
      ) : (
        profiles.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {p.name}{" "}
                {p.isDefault ? <Badge variant="secondary" className="ml-2">Default</Badge> : null}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{p._count.products} product(s)</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead className="text-right">Rates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.zones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No zones yet.</TableCell>
                    </TableRow>
                  ) : (
                    p.zones.map((z) => (
                      <TableRow key={z.id}>
                        <TableCell className="font-medium">{z.name}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">{z.countries}</TableCell>
                        <TableCell className="text-right text-sm">
                          {z.rates.length === 0 ? (
                            <span className="text-muted-foreground">No rates</span>
                          ) : (
                            z.rates.map((r) => (
                              <span key={r.id} className="ml-2 inline-block">
                                {r.name}: ${r.cost.toFixed(2)}
                              </span>
                            ))
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center gap-3">
                <InlineCreateForm
                  endpoint="/api/admin/shipping/zones"
                  triggerLabel="Add zone"
                  fields={[
                    { key: "name", label: "Zone name", required: true, placeholder: "North America" },
                    { key: "countries", label: "Countries (CSV)", required: true, placeholder: "US,CA,MX" },
                  ]}
                  extra={{ profileId: p.id }}
                />
                {p.zones.map((z) => (
                  <InlineCreateForm
                    key={z.id}
                    endpoint="/api/admin/shipping/rates"
                    triggerLabel={`Add rate to ${z.name}`}
                    extra={{ zoneId: z.id }}
                    payloadDefaults={{ rateType: "flat" }}
                    fields={[
                      { key: "name", label: "Rate name", required: true, placeholder: "Standard" },
                      { key: "cost", label: "Cost ($)", type: "number", required: true, defaultValue: "5" },
                      { key: "estimatedDays", label: "Est. days", placeholder: "3-5", emptyAsNull: true },
                    ]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
