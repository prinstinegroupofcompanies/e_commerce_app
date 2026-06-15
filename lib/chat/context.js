import { prisma } from "@/lib/prisma";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { SITE_NAME } from "@/lib/brand";
import { getInteractionInsights } from "@/lib/chat/interactions";
import { getPersonalizedProducts, getPersonalizedSellers } from "@/lib/chat/recommendations";

const APP_GUIDE = `
ShopLIB is a multivendor marketplace. Key areas for shoppers:
- Home (/): trending products, categories, sellers, featured picks
- All products (/products): browse, filter, sort by price/rating/bestsellers
- Product page (/products/[slug]): images, sizes/colors for variable products, reviews, add to cart
- Cart (/cart) and Checkout (/checkout): guest or account checkout, coupons, shipping
- Track order (/track-order): enter order code + email for status
- Compare (/compare): compare up to 4 products side by side
- Wishlist: heart icon on product cards (saved in browser when logged out)
- Seller shops (/shop/[slug]): browse one seller's catalog
- Account (/dashboard): orders, profile, wallet when logged in
- Blog (/blog), categories (/category/[slug]), search (/search?q=)
Sellers register at /seller/register. Support email: support@shoplib.example
`;

/**
 * @param {{
 *   visitorKey: string;
 *   customerId?: string | null;
 *   customerName?: string | null;
 *   customerEmail?: string | null;
 * }} params
 */
export async function buildChatContext({ visitorKey, customerId, customerName, customerEmail }) {
  const visible = catalogProductVisibilityWhere();

  const insights = await getInteractionInsights(visitorKey, customerId);

  const [productCount, sellerCount, categories, topProducts, recommendations, sellers, orders] =
    await Promise.all([
      prisma.product.count({ where: visible }),
      prisma.seller.count({ where: { isActive: true, isShopActive: true } }),
      prisma.category.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.product.findMany({
        where: visible,
        orderBy: { totalSold: "desc" },
        take: 8,
        select: {
          name: true,
          slug: true,
          price: true,
          type: true,
          stockQuantity: true,
          seller: { select: { shopName: true } },
          category: { select: { name: true } },
        },
      }),
      getPersonalizedProducts(insights, 6),
      getPersonalizedSellers(insights),
      customerId
        ? prisma.order.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              code: true,
              orderStatus: true,
              paymentStatus: true,
              total: true,
              createdAt: true,
              trackingId: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const catalogLines = topProducts.map(
    (p) =>
      `- ${p.name} ($${p.price.toFixed(2)}, /products/${p.slug})${p.seller?.shopName ? ` by ${p.seller.shopName}` : ""}${p.type === "variable" ? " [has size/color options]" : ""}`
  );

  const personalizedLines = recommendations.map(
    (p) => `- ${p.name} $${p.price.toFixed(2)} → /products/${p.slug}`
  );

  const sellerLines = sellers
    .filter((s) => s.shopSlug)
    .map((s) => `- ${s.shopName || s.shopSlug} → /shop/${s.shopSlug}`);

  const orderLines = orders.map(
    (o) =>
      `- Order ${o.code}: ${o.orderStatus}, payment ${o.paymentStatus}, $${o.total.toFixed(2)}, placed ${o.createdAt.toISOString().slice(0, 10)}${o.trackingId ? `, tracking ${o.trackingId}` : ""}`
  );

  const behaviorSummary =
    insights.eventCount > 0
      ? `This visitor has ${insights.eventCount} tracked actions (views, cart, wishlist, compare, etc.). Recent interests: ${insights.eventBreakdown.view_product ?? 0} product views, ${insights.eventBreakdown.add_to_cart ?? 0} cart adds, ${insights.eventBreakdown.wishlist_add ?? 0} wishlist saves.`
      : "New visitor with no prior behavior tracked yet.";

  return {
    siteName: SITE_NAME,
    appGuide: APP_GUIDE,
    catalog: {
      productCount,
      sellerCount,
      categories: categories.map((c) => `${c.name} (/category/${c.slug})`).join(", "),
      topProducts: catalogLines.join("\n"),
    },
    user: {
      name: customerName,
      email: customerEmail,
      isLoggedIn: Boolean(customerId),
      behaviorSummary,
      orders: orderLines.join("\n") || "No orders on account.",
      personalizedProducts: personalizedLines.join("\n") || "Use trending catalog.",
      personalizedSellers: sellerLines.join("\n"),
      recentSearches: insights.recentSearches.join(", ") || "none",
    },
    recommendations,
    sellers,
  };
}

/**
 * @param {Awaited<ReturnType<typeof buildChatContext>>} ctx
 */
export function contextToPrompt(ctx) {
  return `You are ShopLIB Assistant for ${ctx.siteName}, a friendly e-commerce guide.

APP NAVIGATION:
${ctx.appGuide}

CATALOG (${ctx.catalog.productCount} products, ${ctx.catalog.sellerCount} sellers):
Categories: ${ctx.catalog.categories}
Bestsellers:
${ctx.catalog.topProducts}

SHOPPER CONTEXT:
${ctx.user.isLoggedIn ? `Logged in as ${ctx.user.name || "customer"} (${ctx.user.email || ""}).` : "Guest (not logged in)."}
${ctx.user.behaviorSummary}
Their orders: ${ctx.user.orders}
Personalized picks for them:
${ctx.user.personalizedProducts}
Shops they may like:
${ctx.user.personalizedSellers}
Recent searches: ${ctx.user.recentSearches}

Rules: Be concise, helpful, accurate. Use real product/shop links from context. For order tracking, tell them to use /track-order with order code + email, or share their order list if logged in. Never invent products not in context.`;
}
