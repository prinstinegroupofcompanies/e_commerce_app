import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWebPushConfigured } from "@/lib/web-push";
import { isSmsConfigured } from "@/lib/sms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushNotificationsToggle } from "@/components/customer/push-notifications-toggle";

export async function MarkayNotifySetup() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });
  const pushSubs = await prisma.pushSubscription.count({
    where: { customerId: session.user.id },
  });

  const needsPhone = !customer?.phone?.trim();
  const needsPush = isWebPushConfigured() && pushSubs === 0;
  if (!needsPhone && !needsPush) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stay updated on orders & delivery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isSmsConfigured() ? (
          <p className="text-muted-foreground">
            Markay Hall sends SMS updates via Twilio when your phone is on file.
          </p>
        ) : (
          <p className="text-muted-foreground">SMS alerts activate when the store configures Twilio.</p>
        )}
        {needsPhone ? (
          <p>
            Add your mobile number in{" "}
            <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">
              account settings
            </Link>{" "}
            (Liberia +231) to receive delivery PIN and status texts.
          </p>
        ) : null}
        {needsPush ? <PushNotificationsToggle /> : null}
      </CardContent>
    </Card>
  );
}
