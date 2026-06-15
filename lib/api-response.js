/**
 * @param {unknown} data
 * @param {Record<string, unknown>} [meta]
 */
export function jsonSuccess(data, meta, status = 200) {
  return Response.json(
    {
      success: true,
      data,
      message: "Success",
      meta: meta ?? {},
    },
    { status }
  );
}

/**
 * @param {string} error
 * @param {unknown[]} [details]
 * @param {number} [status]
 */
export function jsonError(error, details, status = 400) {
  return Response.json(
    { success: false, error, details: details ?? [] },
    { status }
  );
}
