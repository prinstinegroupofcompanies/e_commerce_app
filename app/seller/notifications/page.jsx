import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications" };

export default async function SellerNotificationsPage() {
  const session = await auth();
  if (session?.user?.role !== "seller") redirect("/seller/login");

  const notifications = await prisma.notification.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Announcements and store activity.</p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const inner = (
              <Card className={n.isRead ? "" : "border-primary/30"}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{n.type}</Badge>
                      {!n.isRead ? <span className="h-2 w-2 rounded-full bg-accent" aria-hidden /> : null}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
