import { NextResponse, type NextRequest } from "next/server";
import { sealAskLink } from "@/lib/answer/ask-link";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/config/i18n";

/** Tells pages without route params (e.g. not-found) which language the URL is in. */
export const LOCALE_HEADER = "x-locale";

function withLocaleHeader(request: NextRequest, locale: string): Headers {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return headers;
}

/**
 * Arabic is served at the root without a prefix. Requests without a locale prefix
 * are rewritten internally to /ar/...; a visible /ar/... URL redirects to the clean one.
 */
/**
 * A plain answer link (/ask?q=…&f=…, typed or pasted) is redirected to its sealed form (/ask?t=…) before any page
 * renders, so the question appears in at most this one request. Null when the URL isn't one.
 */
function sealedAskRedirect(request: NextRequest, pathWithoutLocale: string): NextResponse | null {
  const params = request.nextUrl.searchParams;
  const question = params.get("q")?.trim();
  if (pathWithoutLocale !== "/ask" || params.has("t") || !question) return null;
  const followUp = params.get("f")?.trim() || null;
  const url = request.nextUrl.clone();
  url.search = `?t=${encodeURIComponent(sealAskLink({ question, followUp }))}`;
  return NextResponse.redirect(url, 307);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];
  const isLocalePrefixed = (LOCALES as readonly string[]).includes(first);
  const sealed = sealedAskRedirect(request, isLocalePrefixed ? pathname.slice(first.length + 1) || "/" : pathname);
  if (sealed) return sealed;

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  if (isLocalePrefixed) {
    return NextResponse.next({ request: { headers: withLocaleHeader(request, first) } });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url, { request: { headers: withLocaleHeader(request, DEFAULT_LOCALE) } });
}

export const config = {
  matcher: ["/((?!_next|api|ingest|favicon.ico|.*\\..*).*)"],
};
