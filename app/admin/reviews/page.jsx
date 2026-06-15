import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminReviewActions } from "@/components/admin/admin-review-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await auth();
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      product: { select: { name: true, slug: true } },
      customer: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Moderate product reviews before they appear on the storefront.</p>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No reviews yet.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/products/${r.product.slug}`} className="font-medium text-primary hover:underline">
                      {r.product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.customer?.name || "—"}
                    <div className="text-xs text-muted-foreground">{r.customer?.email}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{r.rating}/5</TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                    {r.title || r.body || "—"}
                  </TableCell>
                  <TableCell>
                    {r.isApproved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <AdminReviewActions reviewId={r.id} isApproved={r.isApproved} />
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
