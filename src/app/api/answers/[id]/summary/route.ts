import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/config/i18n";
import { getSummary } from "@/lib/data-access/search";

/**
 * The whole summary in one JSON response (`SummaryOutcome`, never an error). The answer page asks for it only
 * once, when the summary stream breaks; it carries the visitor's IP like the stream does.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/answers/[id]/summary">) {
  const { id } = await params;
  const locale = request.nextUrl.searchParams.get("locale") ?? "ar";
  if (!isLocale(locale)) return NextResponse.json({ status: "failed" }, { status: 422, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(await getSummary(id, locale), { headers: { "Cache-Control": "private, no-store" } });
}
