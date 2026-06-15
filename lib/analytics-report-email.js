import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getAdminAnalyticsSummary } from "@/lib/chat/analytics-admin";
import { SITE_NAME } from "@/lib/brand";

/**
 * Resolve admin report recipient.
 */
export async function getAnalyticsReportRecipient() {
  const envTo = process.env.ANALYTICS_REPORT_EMAIL?.trim();
  if (envTo) return envTo;

  const admin = await prisma.admin.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  return admin?.email ?? null;
}

/**
 * @param {Awaited<ReturnType<typeof getAdminAnalyticsSummary>>} summary
 */
function buildReportHtml(summary) {
  const funnelRows = summary.funnel
    .map((f) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${f.eventType}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${f.count}</td></tr>`)
    .join("");

  const topProducts = summary.topProducts
    .slice(0, 5)
    .map((p) => `<li>${p.product?.name || p.productId} — ${p.count} events</li>`)
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#111">
      <h1 style="font-size:20px">${SITE_NAME} — weekly shop analytics</h1>
      <p style="color:#555">Period: last ${summary.days} days (${summary.since.toLocaleDateString()} – ${summary.until.toLocaleDateString()})</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0"><strong>Total events</strong></td><td style="text-align:right">${summary.totalEvents}</td></tr>
        <tr><td style="padding:8px 0"><strong>Unique visitors</strong></td><td style="text-align:right">${summary.uniqueVisitors}</td></tr>
        <tr><td style="padding:8px 0"><strong>Chat sessions</strong></td><td style="text-align:right">${summary.chatSessions}</td></tr>
        <tr><td style="padding:8px 0"><strong>Logged-in visitors</strong></td><td style="text-align:right">${summary.linkedCustomers}</td></tr>
      </table>
      <h2 style="font-size:16px">Funnel</h2>
      <table style="width:100%;border-collapse:collapse">${funnelRows}</table>
      <h2 style="font-size:16px">Top products</h2>
      <ul>${topProducts || "<li>No product activity</li>"}</ul>
      <p style="margin-top:24px;font-size:13px;color:#666">
        <a href="${process.env.NEXTAUTH_URL || ""}/admin/analytics">Open full analytics dashboard</a>
      </p>
    </div>
  `;
}

/**
 * @param {Awaited<ReturnType<typeof getAdminAnalyticsSummary>>} summary
 */
function buildReportText(summary) {
  const lines = [
    `${SITE_NAME} — shop analytics (${summary.days} days)`,
    `${summary.since.toLocaleDateString()} – ${summary.until.toLocaleDateString()}`,
    "",
    `Total events: ${summary.totalEvents}`,
    `Unique visitors: ${summary.uniqueVisitors}`,
    `Chat sessions: ${summary.chatSessions}`,
    "",
    "Funnel:",
    ...summary.funnel.map((f) => `  ${f.eventType}: ${f.count}`),
    "",
    "Top products:",
    ...summary.topProducts.slice(0, 5).map((p) => `  ${p.product?.name || p.productId}: ${p.count}`),
  ];
  return lines.join("\n");
}

/**
 * Send weekly analytics digest to admin.
 * @param {number} [days]
 */
export async function sendAnalyticsReportEmail(days = 7) {
  const host = process.env.SMTP_HOST;
  const to = await getAnalyticsReportRecipient();
  if (!host) return { skipped: true, reason: "smtp_not_configured" };
  if (!to) return { skipped: true, reason: "no_recipient" };

  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const summary = await getAdminAnalyticsSummary({ days, since, until });

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `${SITE_NAME} <noreply@localhost>`,
    to,
    subject: `${SITE_NAME} analytics — last ${days} days`,
    text: buildReportText(summary),
    html: buildReportHtml(summary),
  });

  return { sent: true, to, days };
}
