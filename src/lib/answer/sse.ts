/** One server-sent event: its name (`message` when unnamed) and its data lines joined. */
export type ServerSentEvent = { event: string; data: string };

/**
 * Incremental parser for a `text/event-stream` body. Feed it decoded text as it arrives; it returns the events
 * completed so far. Comment lines (heartbeats) are skipped; `id` and `retry` are ignored (we never reconnect).
 */
export function createSseParser(): (chunk: string) => ServerSentEvent[] {
  let buffer = "";
  let event = "";
  let data: string[] = [];

  let afterCr = false;

  return (chunk) => {
    // A "\r\n" split across two chunks is one line break, not two.
    if (afterCr && chunk.startsWith("\n")) chunk = chunk.slice(1);
    afterCr = chunk.endsWith("\r");
    buffer += chunk;
    const lines = buffer.split(/\r\n|\r|\n/);
    // The last piece is an unfinished line; keep it for the next chunk.
    buffer = lines.pop() ?? "";
    const events: ServerSentEvent[] = [];
    for (const line of lines) {
      if (line === "") {
        if (data.length > 0) events.push({ event: event || "message", data: data.join("\n") });
        event = "";
        data = [];
        continue;
      }
      if (line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? "" : line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
      if (field === "event") event = value;
      else if (field === "data") data.push(value);
    }
    return events;
  };
}
