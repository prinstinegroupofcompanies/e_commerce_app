import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Languages" };

export default async function AdminLanguagesPage() {
  await auth();
  const languages = await prisma.language.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
          <p className="text-sm text-muted-foreground">Storefront locales available to customers.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/languages"
          triggerLabel="Add language"
          fields={[
            { key: "code", label: "Code", required: true, placeholder: "en" },
            { key: "name", label: "Name", required: true, placeholder: "English" },
            { key: "direction", label: "Direction", defaultValue: "ltr", placeholder: "ltr or rtl" },
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
              <TableHead>Direction</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No languages configured.</TableCell>
              </TableRow>
            ) : (
              languages.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono">{l.code}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell className="uppercase">{l.direction}</TableCell>
                  <TableCell>{l.isDefault ? <Badge variant="secondary">Default</Badge> : null}</TableCell>
                  <TableCell>
                    {l.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!l.isDefault ? (
                        <SimpleToggleButton
                          endpoint={`/api/admin/languages/${l.id}`}
                          field="isDefault"
                          value={false}
                          labelOff="Make default"
                          labelOn="Default"
                        />
                      ) : null}
                      <SimpleToggleButton
                        endpoint={`/api/admin/languages/${l.id}`}
                        field="isActive"
                        value={l.isActive}
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
