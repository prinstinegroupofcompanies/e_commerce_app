import { prisma } from "@/lib/prisma";
import { sendTemplateEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

/**
 * Notify all unsent stock alerts for a product when it has stock again.
 * Idempotent: marks each alert with notifiedAt so future updates don't re-send.
 *
 * @param {string} productId
 */
export async function fireBackInStockAlerts(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, name: true, stockQuantity: true, isActive: true },
  });
  if (!product || !product.isActive || product.stockQuantity <= 0) return { sent: 0 };

  const alerts = await prisma.stockAlert.findMany({
    where: { productId, notifiedAt: null },
    take: 200,
  });
  if (alerts.length === 0) return { sent: 0 };

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const productUrl = `${base}/products/${product.slug}`;

  for (const a of alerts) {
    try {
      await sendTemplateEmail({
        to: a.email,
        subject: `${product.name} is back in stock`,
        template: "back-in-stock.hbs",
        data: { productName: product.name, productUrl },
      });
    } catch (err) {
      console.error("[stock-alert] email", err);
    }
    if (a.customerId) {
      try {
        await notify({
          customerId: a.customerId,
          type: "success",
          title: `${product.name} is back in stock`,
          message: "Tap to view and grab it before it sells out again.",
          link: `/products/${product.slug}`,
        });
      } catch (err) {
        console.error("[stock-alert] notify", err);
      }
    }
  }

  await prisma.stockAlert.updateMany({
    where: { id: { in: alerts.map((a) => a.id) } },
    data: { notifiedAt: new Date() },
  });

  return { sent: alerts.length };
}
