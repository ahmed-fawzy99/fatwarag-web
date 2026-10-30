import "server-only";
import { apiStream } from "@/lib/api/client";
import { isLocale } from "@/lib/config/i18n";

/** No proxy, CDN or compression layer may hold events back (`no-transform` also keeps gzip off). */
const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

/** The longest a summary stream may stay open; the browser gives up far sooner if events stop. */
const MAX_STREAM_MS = 5 * 60_000;

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Passes the API's summary event stream through to the browser, unbuffered. The BFF key and the visitor's IP are
 * added here, server-side; nothing secret reaches the browser. When the browser goes away, the upstream request is
 * aborted too. An API error before the stream starts is passed on as its JSON error with the same status.
 */
export async function proxySummaryStream(request: Request, answerId: string): Promise<Response> {
  const locale = new URL(request.url).searchParams.get("locale") ?? "ar";
  if (!isLocale(locale)) return errorResponse(422, "validation", "Unknown locale.");

  const upstream = new AbortController();
  const abort = () => upstream.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(abort, MAX_STREAM_MS);
  const finish = () => {
    clearTimeout(deadline);
    request.signal.removeEventListener("abort", abort);
  };

  let response: Response;
  try {
    response = await apiStream(`/answers/${encodeURIComponent(answerId)}/summary/stream`, { locale, signal: upstream.signal });
  } catch {
    finish();
    return errorResponse(503, "unavailable", "The summary service couldn't be reached.");
  }

  const isStream = response.headers.get("content-type")?.includes("text/event-stream");
  if (!response.ok || !response.body || !isStream) {
    finish();
    const body: unknown = await response.json().catch(() => null);
    const envelope = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    const code = typeof envelope?.code === "string" ? envelope.code : "unavailable";
    const message = typeof envelope?.message === "string" ? envelope.message : "The summary stream isn't available.";
    return errorResponse(response.ok ? 502 : response.status, code, message);
  }

  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          finish();
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        finish();
        controller.error(error);
      }
    },
    cancel() {
      finish();
      upstream.abort();
    },
  });

  return new Response(body, { status: 200, headers: STREAM_HEADERS });
}
