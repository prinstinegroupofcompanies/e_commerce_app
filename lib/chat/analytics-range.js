/** @type {readonly number[]} */
export const ANALYTICS_DAY_OPTIONS = [7, 30, 90, 365];

/**
 * @param {{ days?: string | string[] | undefined }} searchParams
 */
export function parseAnalyticsRange(searchParams) {
  const raw = Array.isArray(searchParams?.days) ? searchParams.days[0] : searchParams?.days;
  const parsed = parseInt(String(raw ?? "30"), 10);
  const days = ANALYTICS_DAY_OPTIONS.includes(parsed) ? parsed : 30;
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, since, until };
}
