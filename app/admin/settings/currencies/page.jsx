import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Currencies" };

export default async function AdminCurrenciesPage() {
  await auth();
  const currencies = await prisma.currency.findMany({
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Currencies</h1>
          <p className="text-sm text-muted-foreground">Currencies offered at checkout and the platform default.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/currencies"
          triggerLabel="Add currency"
          fields={[
            { key: "code", label: "Code", required: true, placeholder: "USD" },
            { key: "name", label: "Name", required: true, placeholder: "US Dollar" },
            { key: "symbol", label: "Symbol", required: true, placeholder: "$" },
            { key: "exchangeRate", label: "Rate to base", type: "number", defaultValue: "1" },
          ]}
          payloadDefaults={{ isDefault: false, isActive: true }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No currencies configured.</TableCell>
              </TableRow>
            ) : (
              currencies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.exchangeRate}</TableCell>
                  <TableCell>{c.isDefault ? <Badge variant="secondary">Default</Badge> : null}</TableCell>
                  <TableCell>
                    {c.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!c.isDefault ? (
                        <SimpleToggleButton
                          endpoint={`/api/admin/currencies/${c.id}`}
                          field="isDefault"
                          value={false}
                          labelOff="Make default"
                          labelOn="Default"
                        />
                      ) : null}
                      <SimpleToggleButton
                        endpoint={`/api/admin/currencies/${c.id}`}
                        field="isActive"
                        value={c.isActive}
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
