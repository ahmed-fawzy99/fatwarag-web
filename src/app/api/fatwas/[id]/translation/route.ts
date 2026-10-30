import { NextResponse, userAgent, type NextRequest } from "next/server";
import { isLocale } from "@/lib/config/i18n";
import { getTranslation } from "@/lib/data-access/fatwas";

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * First-open translation of a fatwa, for a fatwa expanded on the answer page. A plain GET (not a server action)
 * so several fatwas opened together translate in parallel. The API call carries the visitor's IP and user agent.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/fatwas/[id]/translation">) {
  const { id } = await params;
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  if (!isLocale(locale) || locale === "ar") return error(422, "validation", "Only translations are served here.");
  // Crawlers never trigger a first-time translation.
  if (userAgent(request).isBot) return error(404, "not_found", "No translation is available yet.");

  const text = await getTranslation(id, locale);
  if (!text) return error(502, "upstream_failed", "The translation isn't available right now.");
  return NextResponse.json(text, { headers: { "Cache-Control": "private, no-store" } });
}
