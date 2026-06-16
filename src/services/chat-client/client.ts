import { SseParser, frameToChatEvent } from "./sse";
import type {
  SessionInfo,
  HistoryResponse,
  ChatRequest,
  ChatEvent,
  ChatEventHandler,
  ChatHandle,
  RagModeResponse,
} from "./types";

const STATUS_UNAUTHORIZED = 401;

/**
 * Interface the UI depends on. Swap the implementation when the backend API
 * changes ("a totally different api") without touching React or the store.
 */
export interface McpChatClient {
  getSessionInfo(): Promise<SessionInfo>;
  getHistory(): Promise<HistoryResponse>;
  clearHistory(): Promise<void>;
  setRagMode(enabled: boolean): Promise<RagModeResponse>;
  sendMessage(request: ChatRequest, onEvent: ChatEventHandler): ChatHandle;
}

export interface DerivaChatClientOptions {
  /** Prefix for all endpoints. Empty string => relative to current origin. */
  baseUrl?: string;
  /** Injectable fetch, mainly for tests. */
  fetchImpl?: typeof fetch;
}

/** Concrete client for the current deriva-mcp-ui REST + SSE surface. */
export class DerivaChatClient implements McpChatClient {
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DerivaChatClientOptions = {}) {
    this.base = (options.baseUrl ?? "").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  private url(path: string): string {
    return this.base ? `${this.base}/${path}` : path;
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const response = await this.fetchImpl(this.url("session-info"));
    if (response.status === STATUS_UNAUTHORIZED) {
      throw new AuthError("unauthorized");
    }
    if (!response.ok) {
      throw new Error(`session-info failed: ${response.status}`);
    }
    return response.json() as Promise<SessionInfo>;
  }

  async getHistory(): Promise<HistoryResponse> {
    const response = await this.fetchImpl(this.url("history"));
    if (!response.ok) return { messages: [] };
    return response.json() as Promise<HistoryResponse>;
  }

  async clearHistory(): Promise<void> {
    await this.fetchImpl(this.url("history"), { method: "DELETE" });
  }

  async setRagMode(enabled: boolean): Promise<RagModeResponse> {
    const response = await this.fetchImpl(this.url("rag-mode"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error(`rag-mode failed: ${response.status}`);
    return response.json() as Promise<RagModeResponse>;
  }

  sendMessage(request: ChatRequest, onEvent: ChatEventHandler): ChatHandle {
    const controller = new AbortController();
    void this.stream(request, onEvent, controller.signal);
    return { abort: () => controller.abort() };
  }

  private async stream(
    request: ChatRequest,
    onEvent: ChatEventHandler,
    signal: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.url("chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });
    } catch (error) {
      if (isAbort(error)) return;
      onEvent({ type: "error", detail: `Connection lost: ${describe(error)}` });
      return;
    }

    if (response.status === STATUS_UNAUTHORIZED) {
      let body: { error?: string } | null = null;
      try {
        body = (await response.json()) as { error?: string };
      } catch {
        /* ignore */
      }
      onEvent({
        type: "error",
        error: body?.error === "session_expired" ? "session_expired" : "auth",
        status: STATUS_UNAUTHORIZED,
      });
      return;
    }

    if (!response.ok || !response.body) {
      onEvent({ type: "error", detail: `Server error ${response.status}`, status: response.status });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SseParser();
    let sawDone = false;

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const frames = parser.push(decoder.decode(value, { stream: true }));
        for (const frame of frames) {
          const event = frameToChatEvent(frame);
          if (!event) continue;
          onEvent(event);
          if (event.type === "done") {
            sawDone = true;
            break;
          }
        }
        if (sawDone) break;
      }
    } catch (error) {
      if (isAbort(error)) return;
      onEvent({ type: "error", detail: `Connection lost: ${describe(error)}` });
      return;
    }

    // The backend may close the stream without an explicit done frame; the UI
    // still needs a terminal signal to finalise the message.
    if (!sawDone) onEvent({ type: "done" });
  }
}

export class AuthError extends Error {}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
