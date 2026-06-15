import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reviews" };

function Stars({ rating }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} stars`}>
      {"★".repeat(rating)}
      <span className="text-muted-foreground/40">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export default async function SellerReviewsPage() {
  const session = await auth();
  if (session?.user?.role !== "seller") redirect("/seller/login");

  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  const [reviews, ratingAgg] = await Promise.all([
    prisma.review.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        product: { select: { name: true, slug: true } },
        customer: { select: { name: true, email: true } },
      },
    }),
    prisma.review.aggregate({
      where: { productId: { in: productIds }, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Customer feedback on your products.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(2) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{ratingAgg._count._all}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{reviews.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No reviews yet.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/products/${r.product.slug}`} className="text-primary hover:underline">
                      {r.product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.customer?.name || r.customer?.email || "Guest"}
                  </TableCell>
                  <TableCell>
                    <Stars rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-[280px] text-sm">
                    {r.title ? <p className="font-medium">{r.title}</p> : null}
                    <p className="text-muted-foreground">{r.body || "—"}</p>
                  </TableCell>
                  <TableCell>
                    {r.isApproved ? (
                      <Badge variant="secondary">Published</Badge>
                    ) : (
                      <Badge variant="outline">Awaiting review</Badge>
                    )}
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
