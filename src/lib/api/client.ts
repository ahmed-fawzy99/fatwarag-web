import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { headers } from "next/headers";
import { isIP } from "node:net";
import type { Locale } from "@/lib/config/i18n";

/** Error codes from the API envelope, plus the two the client adds itself. */
export type ApiErrorCode =
  | "not_found"
  | "validation"
  | "turnstile_failed"
  | "daily_cap_reached"
  | "rate_limited"
  | "budget_exhausted"
  | "upstream_failed"
  | "timeout"
  /** The API couldn't be reached or answered with something that isn't the envelope. */
  | "unavailable";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown, code?: ApiErrorCode): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

type Outcome<T> = { ok: true; data: T } | { ok: false; status: number; code: ApiErrorCode; message: string };

type Query = Record<string, string | number | undefined>;

export type ApiGetOptions = {
  locale?: Locale;
  query?: Query;
  /**
   * Seconds to keep the response in the Next.js cache. Cached reads are shared by every visitor, so they
   * carry no visitor identity. Leave unset for per-request reads (they forward the visitor's IP).
   */
  revalidate?: number;
  /** Cache tags, so a later `revalidateTag` can clear the entry. Only used with `revalidate`. */
  tags?: string[];
  timeoutMs?: number;
};

export type ApiPostOptions = { locale?: Locale; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 15_000;

const STATUS_CODES: Record<number, ApiErrorCode> = {
  403: "turnstile_failed",
  404: "not_found",
  422: "validation",
  429: "rate_limited",
  502: "upstream_failed",
  503: "budget_exhausted",
  504: "timeout",
};

function buildUrl(path: string, locale: Locale | undefined, query: Query | undefined): string {
  const base = process.env.API_URL?.replace(/\/$/, "") ?? "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) params.set(key, String(value));
  if (locale) params.set("locale", locale);
  const search = params.toString();
  return `${base}${path}${search ? `?${search}` : ""}`;
}

/**
 * The visitor's IP, from a header the visitor can't set. On Vercel that is its own `x-vercel-forwarded-for`, then
 * `x-real-ip` (both set by Vercel's edge). Elsewhere it is the right-most `x-forwarded-for` entry, added by the
 * server in front of us. Never the left-most entry, which the visitor controls. The API rejects a keyed request
 * without a valid IP, so there is always one.
 */
function visitorIp(incoming: Headers): string {
  const candidates = process.env.VERCEL
    ? [incoming.get("x-vercel-forwarded-for")?.split(",")[0], incoming.get("x-real-ip")]
    : [incoming.get("x-forwarded-for")?.split(",").at(-1)];
  for (const candidate of candidates) {
    const ip = candidate?.trim().replace(/^::ffff:/, "");
    if (ip && isIP(ip)) return ip;
  }
  return "127.0.0.1";
}

/** Identity headers for per-visitor requests: the visitor's IP (for limits) and user agent (for bot checks). */
async function visitorHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const result: Record<string, string> = { "X-BFF-Key": process.env.BFF_KEY ?? "", "X-Client-IP": visitorIp(incoming) };
  const agent = incoming.get("user-agent");
  if (agent) result["User-Agent"] = agent;
  return result;
}

async function request<T>(url: string, init: RequestInit, timeoutMs: number): Promise<Outcome<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return { ok: false, status: timedOut ? 504 : 503, code: timedOut ? "timeout" : "unavailable", message: String(error) };
  }

  const NOT_JSON = Symbol("not-json");
  const body: unknown = await response.json().catch(() => NOT_JSON);
  if (response.ok) {
    // A success that isn't JSON (e.g. a proxy's HTML page) is not data: treat the API as unavailable.
    if (body === NOT_JSON && response.status !== 204) {
      return { ok: false, status: 502, code: "unavailable", message: "The API answered with something other than JSON." };
    }
    return { ok: true, data: (body === NOT_JSON ? null : body) as T };
  }

  const envelope = body === NOT_JSON ? undefined : (body as { error?: { code?: string; message?: string } } | null)?.error;
  const code = (envelope?.code as ApiErrorCode | undefined) ?? STATUS_CODES[response.status] ?? "unavailable";
  return { ok: false, status: response.status, code, message: envelope?.message ?? response.statusText };
}

/**
 * A shared, cached read. It belongs to no visitor, so it goes without the BFF key and the API keys any limit
 * on this server's own address. Failures are kept only briefly so a recovered API is picked up quickly.
 */
async function cachedGet<T>(url: string, revalidate: number, tags: string[], timeoutMs: number): Promise<Outcome<T>> {
  "use cache";
  const outcome = await request<T>(url, { method: "GET" }, timeoutMs);
  if (outcome.ok || outcome.code === "not_found") {
    cacheLife({ stale: Math.min(300, revalidate), revalidate, expire: Math.max(revalidate * 24, 86_400) });
    if (tags.length > 0) cacheTag(...tags);
  } else {
    cacheLife("seconds");
  }
  return outcome;
}

function unwrap<T>(outcome: Outcome<T>): T {
  if (outcome.ok) return outcome.data;
  throw new ApiError(outcome.status, outcome.code, outcome.message);
}

/** GET from the Laravel API. Throws `ApiError` on any failure (404 → code `not_found`). */
export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const url = buildUrl(path, options.locale, options.query);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (options.revalidate) return unwrap(await cachedGet<T>(url, options.revalidate, options.tags ?? [], timeoutMs));
  return unwrap(await request<T>(url, { method: "GET", headers: await visitorHeaders() }, timeoutMs));
}

/** POST to the Laravel API on behalf of the visitor. Throws `ApiError` on any failure. */
export async function apiPost<T>(path: string, body: unknown, options: ApiPostOptions = {}): Promise<T> {
  const url = buildUrl(path, options.locale, undefined);
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await visitorHeaders()) },
    body: JSON.stringify(body),
  };
  return unwrap(await request<T>(url, init, options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
}

/**
 * Opens a per-visitor streaming GET (e.g. server-sent events) and hands back the raw response, unread, so the
 * caller can pass its body straight through. It carries the BFF key and the visitor's IP like any other
 * per-visitor read. `signal` ends the upstream request (e.g. when the visitor leaves). Throws only when the API
 * can't be reached at all.
 */
export async function apiStream(path: string, options: { locale?: Locale; signal: AbortSignal; accept?: string }): Promise<Response> {
  return fetch(buildUrl(path, options.locale, undefined), {
    method: "GET",
    headers: { Accept: options.accept ?? "text/event-stream", ...(await visitorHeaders()) },
    signal: options.signal,
    cache: "no-store",
  });
}

/** Runs a read and turns a 404 into `null`; other failures still throw. */
export async function orNull<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (isApiError(error, "not_found")) return null;
    throw error;
  }
}
