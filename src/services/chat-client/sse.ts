// Pure, incremental Server-Sent-Events frame parser. Pure so it can be unit
// tested without a network. Mirrors the framing used by the backend: frames are
// separated by a blank line; within a frame "event: <name>" and "data: <json>".

export interface SseFrame {
  event: string;
  data: string;
}

export class SseParser {
  private buffer = "";

  /** Feed a decoded text chunk; returns any complete frames it produced. */
  push(text: string): SseFrame[] {
    this.buffer += text;
    const frames: SseFrame[] = [];
    let boundary: number;
    while ((boundary = this.buffer.indexOf("\n\n")) !== -1) {
      const raw = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      let event = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      frames.push({ event, data });
    }
    return frames;
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Map a raw SSE frame onto the normalised ChatEvent union, or null to ignore. */
export function frameToChatEvent(frame: SseFrame): import("./types").ChatEvent | null {
  const { event, data } = frame;

  if (event === "done") return { type: "done" };

  if (event === "status") {
    const parsed = safeParse(data) as { message?: string } | null;
    return parsed?.message ? { type: "status", message: parsed.message } : null;
  }

  if (event === "error") {
    const parsed = (safeParse(data) as { error?: string; detail?: string } | null) ?? {};
    return { type: "error", error: parsed.error, detail: parsed.detail };
  }

  if (event === "tool") {
    const parsed = safeParse(data) as
      | { type?: string; name?: string; input?: unknown; result?: string }
      | null;
    if (parsed?.type === "tool_start") {
      return { type: "tool_start", name: parsed.name ?? "", input: parsed.input };
    }
    if (parsed?.type === "tool_end") {
      return { type: "tool_end", name: parsed.name ?? "", result: parsed.result ?? "" };
    }
    return null;
  }

  // Default frame: a JSON-encoded string text chunk.
  const chunk = safeParse(data);
  return typeof chunk === "string" ? { type: "text", chunk } : null;
}
