// Shapes mirrored from the deriva-mcp-ui backend (session-info, history, chat SSE).
// Keep this file as the single source of truth for the wire contract so the UI
// never reaches into raw responses.

export interface SessionInfo {
  session_id?: string | null;
  login_available?: boolean;
  display_name?: string;
  user_id?: string;
  show_response_cards?: boolean;
  chat_align_left?: boolean;
  code_theme?: string;
  catalog_mode?: "default" | "general";
  label?: string;
  hostname?: string;
  rag_only_when_anonymous?: boolean;
  rag_mode_active?: boolean;
  rag_toggle_available?: boolean;
  // The backend also returns extra identity fields used for the user tooltip.
  [key: string]: unknown;
}

export interface HistoryMessage {
  role: "user" | "assistant" | "tool_use";
  content?: string;
  tools?: string[];
}

export interface HistoryResponse {
  messages: HistoryMessage[];
  input_history?: string[];
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  hostname?: string;
  catalog_id?: string;
}

export interface RagModeResponse {
  rag_mode_active: boolean;
}

// Normalised stream events. The raw SSE protocol (event names: status / tool /
// error / done plus default text frames) is collapsed into this flat union so
// callers do not parse frames themselves.
export type ChatEvent =
  | { type: "status"; message: string }
  | { type: "text"; chunk: string }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; result: string }
  | { type: "error"; error?: string; detail?: string; status?: number }
  | { type: "done" };

export type ChatEventHandler = (event: ChatEvent) => void;

export interface ChatHandle {
  abort(): void;
}
