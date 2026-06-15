const STORAGE_KEY = "shoplib_vid";
const FLUSH_MS = 1200;

/** @type {Record<string, unknown>[]} */
let queue = [];
let flushTimer = null;

export function getVisitorKey() {
  if (typeof window === "undefined") return null;
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, key);
  }
  return key;
}

/**
 * @param {Record<string, unknown>} event
 */
export function trackInteraction(event) {
  if (typeof window === "undefined") return;
  queue.push({ ...event, ts: Date.now() });
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, FLUSH_MS);
}

async function flushQueue() {
  if (!queue.length) return;
  const batch = queue.splice(0, 40);
  const visitorKey = getVisitorKey();
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-Key": visitorKey || "",
      },
      body: JSON.stringify({ events: batch }),
      credentials: "same-origin",
    });
  } catch {
    queue = batch.concat(queue).slice(0, 80);
  }
}

export async function ensureVisitorCookie() {
  const visitorKey = getVisitorKey();
  if (!visitorKey) return;
  try {
    await fetch("/api/chat/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorKey }),
      credentials: "same-origin",
    });
  } catch {
    /* ignore */
  }
}
