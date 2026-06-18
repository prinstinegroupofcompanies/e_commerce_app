import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/upload-url";

function Stars({ rating }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} stars`}>
      {"★".repeat(rating)}
      <span className="text-muted-foreground/40">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export async function CustomerReviewsList() {
  const session = await auth();
  if (session?.user?.role !== "customer") redirect("/login");

  const reviews = await prisma.review.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true, images: true } },
    },
  });

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">You have not written any reviews yet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/orders">View past orders</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        let img = null;
        try {
          const imgs = r.product.images ? JSON.parse(r.product.images) : [];
          img = Array.isArray(imgs) ? imgs[0] : null;
        } catch {
          img = null;
        }
        return (
          <Card key={r.id}>
            <CardContent className="flex gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(img) || "/placeholder-product.svg"} alt={r.product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/products/${r.product.slug}`} className="font-medium text-primary hover:underline">
                    {r.product.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    {r.isApproved ? (
                      <Badge variant="secondary">Published</Badge>
                    ) : (
                      <Badge variant="outline">Awaiting moderation</Badge>
                    )}
                  </div>
                </div>
                {r.title ? <p className="text-sm font-medium">{r.title}</p> : null}
                {r.body ? <p className="text-sm text-muted-foreground">{r.body}</p> : null}
                {r.adminReply ? (
                  <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Store reply: </span>
                    {r.adminReply}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
