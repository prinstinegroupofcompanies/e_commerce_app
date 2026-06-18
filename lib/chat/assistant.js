import { prisma } from "@/lib/prisma";
import { buildChatContext, contextToPrompt } from "@/lib/chat/context";
import { formatOrderStatus } from "@/lib/order-labels";

/**
 * @param {string} message
 */
function detectIntent(message) {
  const m = message.toLowerCase();
  if (/track|order status|where is my order|delivery|shipment/.test(m)) return "track_order";
  if (/recommend|suggest|for me|personalized|based on/.test(m)) return "recommend";
  if (/how (do|to)|help|guide|checkout|wishlist|compare|cart|account|sell/.test(m)) return "how_to";
  if (/seller|shop|store|vendor/.test(m)) return "sellers";
  if (/product|buy|price|stock|category|search/.test(m)) return "products";
  if (/hello|hi|hey|thanks|thank you/.test(m)) return "greeting";
  return "general";
}

/**
 * @param {Awaited<ReturnType<typeof buildChatContext>>} ctx
 * @param {string} intent
 * @param {string} message
 */
async function ruleBasedReply(ctx, intent, message) {
  const site = ctx.siteName;

  if (intent === "greeting") {
    const name = ctx.user.name ? ` ${ctx.user.name.split(" ")[0]}` : "";
    const personal =
      ctx.user.behaviorSummary.includes("tracked actions") && !ctx.user.behaviorSummary.includes("New visitor")
        ? " I remember what you've browsed — ask me for personalized picks anytime."
        : "";
    return `Hi${name}! I'm your ${site} shopping assistant.${personal} I can track orders, recommend products & sellers, and guide you around the store. What would you like help with?`;
  }

  if (intent === "track_order") {
    const codeMatch = message.match(/\b[A-Z0-9]{6,}\b/);
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (codeMatch && emailMatch) {
      return await lookupOrderInline(codeMatch[0], emailMatch[0]);
    }
    if (ctx.user.isLoggedIn && ctx.user.orders && !ctx.user.orders.includes("No orders")) {
      return `Here are your recent orders:\n${ctx.user.orders}\n\nFor full details visit **Track order** at /track-order with your order code and email. Need a specific order? Send me the code (e.g. ORD-XXXX) and your email.`;
    }
    return `To track an order, go to **/track-order** and enter your **order code** and **email** used at checkout. If you're logged in, I can list recent orders — just ask "show my orders".`;
  }

  if (intent === "recommend") {
    const lines = ctx.recommendations.length
      ? ctx.recommendations
          .map((p) => `• **${p.name}** — $${p.price.toFixed(2)} → [/products/${p.slug}](/products/${p.slug})`)
          .join("\n")
      : ctx.catalog.topProducts
          .split("\n")
          .slice(0, 4)
          .map((l) => l.replace("- ", "• "))
          .join("\n");
    const reason =
      ctx.user.behaviorSummary.includes("tracked actions") && !ctx.user.behaviorSummary.includes("New visitor")
        ? "Based on products you've viewed, saved, or added to cart:"
        : "Popular picks right now:";
    return `${reason}\n\n${lines}\n\nBrowse more at [/products](/products) or tell me a category you like.`;
  }

  if (intent === "sellers") {
    const lines = ctx.sellers
      .filter((s) => s.shopSlug)
      .map((s) => `• **${s.shopName || s.shopSlug}** → [/shop/${s.shopSlug}](/shop/${s.shopSlug})`)
      .join("\n");
    return `We have **${ctx.catalog.sellerCount}** active seller shops. ${ctx.user.personalizedSellers ? "Shops you might enjoy:\n" + lines : lines || "Visit the home page seller carousel or /products."}\n\nWant to open your own shop? Go to [/seller/register](/seller/register).`;
  }

  if (intent === "how_to") {
    const m = message.toLowerCase();
    if (m.includes("checkout")) {
      return `**Checkout:** Add items from product pages → open **Cart** (/cart) → **Checkout** (/checkout). Sign in for faster checkout or continue as guest. Enter delivery details, pick payment, and confirm.`;
    }
    if (m.includes("wishlist")) {
      return `**Wishlist:** Tap the heart on any product card. Saved items stay in your browser; create an account at /register to sync across devices.`;
    }
    if (m.includes("compare")) {
      return `**Compare:** Use the compare toggle on product cards (up to 4 items). Open **/compare** to see specs side by side.`;
    }
    if (m.includes("variable") || m.includes("size") || m.includes("color")) {
      return `Some products have **size/color options**. On the product page, pick options before **Add to cart**. On listing cards, tap the image to flip photos, tap again to open the product.`;
    }
    return `Quick guide:\n• Browse: [/products](/products) or home page trending carousel\n• Product details: tap name or image (multi-image: tap image to cycle, tap again to open)\n• Cart: [/cart](/cart) → Checkout: [/checkout](/checkout)\n• Track orders: [/track-order](/track-order)\n• Account: [/dashboard](/dashboard)\n\nAsk me anything specific!`;
  }

  if (intent === "products") {
    return `Our catalog has **${ctx.catalog.productCount}** products across categories: ${ctx.catalog.categories}.\n\nTop sellers:\n${ctx.catalog.topProducts.split("\n").slice(0, 5).join("\n")}\n\nSearch: [/search](/search) or browse [/products](/products).`;
  }

  return `I'm here to help with ${site} — orders, product picks, seller shops, and how to use the site. Try:\n• "Recommend products for me"\n• "Track my order ORD-123 email@example.com"\n• "How do I checkout?"`;
}

/**
 * @param {string} code
 * @param {string} email
 */
async function lookupOrderInline(code, email) {
  const order = await prisma.order.findFirst({
    where: {
      code: code.toUpperCase(),
      OR: [{ guestEmail: email.toLowerCase() }, { customer: { email: email.toLowerCase() } }],
    },
    include: {
      statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      items: { select: { name: true, quantity: true, deliveryStatus: true } },
    },
  });
  if (!order) {
    return `I couldn't find order **${code.toUpperCase()}** for that email. Double-check the code and email from your confirmation, or use [/track-order](/track-order).`;
  }
  const items = order.items.map((i) => `${i.name} ×${i.quantity} (${i.deliveryStatus})`).join(", ");
  const history = order.statusHistory.map((h) => h.status).join(" → ");
  return `**Order ${order.code}**\n• Status: **${formatOrderStatus(order.orderStatus)}**\n• Payment: ${order.paymentStatus}\n• Total: $${order.total.toFixed(2)}\n• Items: ${items}\n• Updates: ${history || "pending"}\n${order.trackingId ? `• Tracking ID: ${order.trackingId}` : ""}`;
}

/**
 * @param {{
 *   message: string;
 *   visitorKey: string;
 *   customerId?: string | null;
 *   customerName?: string | null;
 *   customerEmail?: string | null;
 *   history?: { role: string; content: string }[];
 * }} params
 */
export async function generateAssistantReply(params) {
  const ctx = await buildChatContext({
    visitorKey: params.visitorKey,
    customerId: params.customerId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
  });

  const intent = detectIntent(params.message);
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const system = contextToPrompt(ctx);
      const messages = [
        { role: "system", content: system },
        ...(params.history ?? []).slice(-8).map((h) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: h.content,
        })),
        { role: "user", content: params.message },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.4,
          max_tokens: 700,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return {
            content: text,
            recommendations: ctx.recommendations,
            intent,
            source: "openai",
          };
        }
      }
    } catch (e) {
      console.error("[chat] OpenAI error", e);
    }
  }

  return {
    content: await ruleBasedReply(ctx, intent, params.message),
    recommendations: ctx.recommendations,
    intent,
    source: "rules",
  };
}
