/**
 * Encode visitor key for URL-safe admin links.
 * @param {string} visitorKey
 */
export function encodeVisitorKey(visitorKey) {
  return Buffer.from(visitorKey, "utf8").toString("base64url");
}

/**
 * @param {string} encoded
 */
export function decodeVisitorKey(encoded) {
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * @param {string} visitorKey
 * @param {number} [days]
 */
export function visitorAnalyticsHref(visitorKey, days = 30) {
  return `/admin/analytics/visitors/${encodeVisitorKey(visitorKey)}?days=${days}`;
}
