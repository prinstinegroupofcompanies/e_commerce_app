/**
 * @param {string | null | undefined} raw
 * @returns {unknown}
 */
export function parseJsonSafe(raw) {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} raw
 * @returns {string[]}
 */
export function parseStringArray(raw) {
  const v = parseJsonSafe(raw);
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
