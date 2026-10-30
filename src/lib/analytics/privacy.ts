/**
 * What may leave the browser. Pure functions (no PostHog, no DOM) so they can be unit-tested.
 * The sealed ask link (`/ask?t=…`) carries a personal religious question, so it never goes to analytics.
 */

/** Property names that could hold what a visitor typed or who they are; dropped whatever the caller passes. */
const FORBIDDEN_KEYS = /^(question|follow_?up|text|message|comment|body|query|q|name|email|phone|token|t)$/i;

/** Longest string property kept: ids and short labels only, never free text. */
const MAX_STRING_LENGTH = 64;

/** Query parameters that can carry text or tokens, removed from every URL we send (all of them on /ask). */
const SENSITIVE_PARAMS = ["t", "q", "f", "hl"];

/** `/ask` or `/en/ask`, with or without a trailing slash. */
function isAskPath(pathname: string): boolean {
  return /^(\/en)?\/ask\/?$/.test(pathname);
}

/**
 * A URL or path with anything private removed: on /ask the whole query string and hash go; elsewhere the
 * parameters that could carry text. Anything that isn't a URL comes back unchanged.
 */
export function maskUrl(value: string): string {
  const isAbsolute = /^https?:\/\//i.test(value);
  if (!isAbsolute && !value.startsWith("/")) return value;
  let url: URL;
  try {
    url = new URL(value, "http://local.invalid");
  } catch {
    return value;
  }
  if (isAskPath(url.pathname)) {
    url.search = "";
    url.hash = "";
  } else {
    for (const param of SENSITIVE_PARAMS) url.searchParams.delete(param);
  }
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

/**
 * PostHog's own event properties with every URL masked, at any depth: `$current_url`, `$pathname`, `$referrer`, and
 * the copies PostHog nests elsewhere (e.g. `$set_once.$initial_current_url`). Any string that looks like a URL or a
 * path is masked whatever its key, since masking leaves other URLs as they were.
 */
export function maskEventProperties<T extends Record<string, unknown>>(properties: T): T {
  return maskDeep(properties) as T;
}

function maskDeep(value: unknown): unknown {
  if (typeof value === "string") return maskUrl(value);
  if (Array.isArray(value)) return value.map(maskDeep);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, maskDeep(inner)]));
  }
  return value;
}

/** Our own event properties, reduced to numbers, booleans and short strings under non-sensitive names. */
export function scrubProps(props: Record<string, unknown>): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.test(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") clean[key] = value;
    else if (typeof value === "string" && value.length <= MAX_STRING_LENGTH) clean[key] = value;
  }
  return clean;
}
