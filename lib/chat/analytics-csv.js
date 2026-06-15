/**
 * Escape a CSV field.
 * @param {unknown} value
 */
function esc(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {Awaited<ReturnType<import("./analytics-admin").getEventsForExport>>} rows
 */
export function buildAnalyticsCsv(rows) {
  const headers = [
    "created_at",
    "event_type",
    "visitor_key",
    "customer_id",
    "customer_name",
    "customer_email",
    "product_id",
    "product_name",
    "product_slug",
    "seller_id",
    "seller_name",
    "category_id",
    "path",
    "metadata",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.eventType,
        r.visitorKey,
        r.customerId ?? "",
        r.customerName,
        r.customerEmail,
        r.productId ?? "",
        r.productName,
        r.productSlug,
        r.sellerId ?? "",
        r.sellerName,
        r.categoryId ?? "",
        r.path ?? "",
        r.metadata ?? "",
      ]
        .map(esc)
        .join(",")
    ),
  ];

  return lines.join("\n");
}

/**
 * @param {Awaited<ReturnType<import("./analytics-admin").getAdminAnalyticsSummary>>} summary
 */
export function buildSummaryCsv(summary) {
  const lines = [
    "metric,value",
    `period_days,${summary.days}`,
    `period_start,${summary.since.toISOString()}`,
    `period_end,${summary.until.toISOString()}`,
    `total_events,${summary.totalEvents}`,
    `unique_visitors,${summary.uniqueVisitors}`,
    `visitor_profiles,${summary.visitorProfiles}`,
    `linked_customers,${summary.linkedCustomers}`,
    `chat_sessions,${summary.chatSessions}`,
    `chat_messages,${summary.chatMessages}`,
    "",
    "event_type,count",
    ...summary.eventBreakdown.map((e) => `${esc(e.eventType)},${e.count}`),
    "",
    "funnel_step,count",
    ...summary.funnel.map((f) => `${esc(f.eventType)},${f.count}`),
  ];
  return lines.join("\n");
}
