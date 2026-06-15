import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Menus" };

export default async function AdminMenusPage() {
  await auth();
  const menus = await prisma.menu.findMany({
    orderBy: { location: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation menus</h1>
          <p className="text-sm text-muted-foreground">Storefront menus by location (header, footer…).</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/menus"
          triggerLabel="New menu"
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "location", label: "Location", required: true, placeholder: "header" },
          ]}
        />
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No menus yet.</CardContent>
        </Card>
      ) : (
        menus.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {m.name} <span className="ml-2 font-mono text-xs text-muted-foreground">{m.location}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-right">#</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No items yet.</TableCell>
                    </TableRow>
                  ) : (
                    m.items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{i.sortOrder}</TableCell>
                        <TableCell className="font-medium">{i.label}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{i.url}</TableCell>
                        <TableCell>{i.target || "_self"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <InlineCreateForm
                endpoint="/api/admin/menus/items"
                triggerLabel="Add item"
                extra={{ menuId: m.id }}
                fields={[
                  { key: "label", label: "Label", required: true },
                  { key: "url", label: "URL", required: true },
                  { key: "sortOrder", label: "Order", type: "number", defaultValue: "0" },
                  { key: "target", label: "Target", emptyAsNull: true },
                ]}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
