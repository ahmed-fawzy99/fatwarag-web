import { proxySummaryStream } from "@/lib/data-access/summary-stream";

/** The answer's summary as server-sent events (stage, item, done, status), proxied from the API. */
export async function GET(request: Request, { params }: RouteContext<"/api/answers/[id]/summary/stream">) {
  const { id } = await params;
  return proxySummaryStream(request, id);
}
