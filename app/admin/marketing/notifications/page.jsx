import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BroadcastForm } from "@/components/admin/broadcast-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  await auth();
  const recent = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { name: true, email: true } },
      seller: { select: { name: true, shopName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Broadcast in-app messages to customers and sellers.</p>
      </div>

      <BroadcastForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Read</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No notifications sent yet.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {n.customer ? `Customer · ${n.customer.name || n.customer.email}` : null}
                      {n.seller ? `Seller · ${n.seller.shopName || n.seller.name}` : null}
                    </TableCell>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{n.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {n.isRead ? <Badge variant="secondary">Read</Badge> : <Badge variant="outline">Unread</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
