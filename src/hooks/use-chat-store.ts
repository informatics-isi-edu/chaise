import { create } from 'zustand';
import {
  DerivaChatClient,
  type McpChatClient,
  type SessionInfo,
  type ChatHandle,
} from '@isrd-isi-edu/chaise/src/services/chat-client';

// ---- UI message model ----------------------------------------------------

export interface ToolCallState {
  id: string;
  name: string;
  input?: unknown;
  result?: string;
  status: 'running' | 'done';
}

export interface UserMessage {
  id: string;
  kind: 'user';
  content: string;
}

export interface AssistantMessage {
  id: string;
  kind: 'assistant';
  text: string;
  tools: ToolCallState[];
  status?: string;
  stopped?: boolean;
}

export type ChatMessage = UserMessage | AssistantMessage;

export type AuthState = 'ok' | 'logged_out' | 'expired';

export type ChatState = {
  session: SessionInfo | null;
  messages: ChatMessage[];
  cmdHistory: string[];
  busy: boolean;
  ragModeActive: boolean;
  ragToggleAvailable: boolean;
  catalogMode: 'default' | 'general';
  catalog: { hostname: string; catalogId: string };
  authState: AuthState;
  // transient: a one-shot error message for the host to surface via the Chaise
  // alert service, then clear. Not rendered inline.
  error: string | null;

  init: (baseUrl?: string) => Promise<void>;
  send: (text: string) => void;
  stop: () => void;
  clearHistory: () => Promise<void>;
  toggleRagMode: () => Promise<void>;
  setCatalog: (patch: Partial<{ hostname: string; catalogId: string }>) => void;
  clearError: () => void;
};

const newId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const isAuthenticated = (s: SessionInfo | null): boolean =>
  !!s && !s.login_available && s.display_name !== 'Anonymous';

/**
 * App-global assistant store. There is one assistant per app instance and it
 * takes no props, so `create` (a module-level hook, no provider) is the
 * idiomatic choice per the zustand docs. The transport client and the per-turn
 * streaming scratch (active message id, separator flag, abort handle) live in
 * the initializer closure: they are working memory that nothing renders from,
 * so keeping them out of the reactive state avoids needless re-renders, and
 * keeping them in the closure (not module globals) keeps them private to the
 * store. Consumers read with per-field selectors: useChatStore((s) => s.busy).
 */
export const useChatStore = create<ChatState>((set, get) => {
  let client: McpChatClient | null = null;
  let activeAssistantId: string | null = null;
  let needsSeparator = false;
  let handle: ChatHandle | null = null;

  const patchAssistant = (
    msgId: string,
    update: (m: AssistantMessage) => AssistantMessage,
  ): void =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === msgId && m.kind === 'assistant' ? update(m) : m,
      ),
    }));

  const finalize = (): void => {
    if (activeAssistantId) {
      set((state) => ({
        messages: state.messages.filter(
          (m) =>
            !(
              m.id === activeAssistantId &&
              m.kind === 'assistant' &&
              m.text === '' &&
              m.tools.length === 0
            ),
        ),
      }));
    }
    activeAssistantId = null;
    needsSeparator = false;
    handle = null;
    set({ busy: false });
  };

  return {
    session: null,
    messages: [],
    cmdHistory: [],
    busy: false,
    ragModeActive: false,
    ragToggleAvailable: false,
    catalogMode: 'default',
    catalog: { hostname: '', catalogId: '' },
    authState: 'ok',
    error: null,

    init: async (baseUrl?: string) => {
      if (!client) client = new DerivaChatClient({ baseUrl: baseUrl ?? '' });

      let session: SessionInfo;
      try {
        session = await client.getSessionInfo();
      } catch (error) {
        const name = error instanceof Error ? error.name : '';
        set({ authState: name === 'AuthError' ? 'logged_out' : 'ok' });
        if (name !== 'AuthError') {
          set({ error: 'Could not load the assistant session. Please refresh.' });
        }
        return;
      }

      set({
        session,
        ragModeActive: !!session.rag_mode_active,
        ragToggleAvailable: !!session.rag_toggle_available,
        catalogMode: session.catalog_mode === 'general' ? 'general' : 'default',
        authState: 'ok',
      });

      const history = await client.getHistory();
      const restored: ChatMessage[] = [];
      for (const msg of history.messages ?? []) {
        if (msg.role === 'user') {
          restored.push({ id: newId(), kind: 'user', content: msg.content ?? '' });
        } else if (msg.role === 'assistant') {
          restored.push({ id: newId(), kind: 'assistant', text: msg.content ?? '', tools: [] });
        } else if (msg.role === 'tool_use') {
          restored.push({
            id: newId(),
            kind: 'assistant',
            text: '',
            tools: (msg.tools ?? []).map((name) => ({ id: newId(), name, status: 'done' as const })),
          });
        }
      }
      set((s) => ({
        messages: [...s.messages, ...restored],
        cmdHistory: history.input_history?.length ? [...history.input_history] : s.cmdHistory,
      }));
    },

    send: (text: string) => {
      const trimmed = text.trim();
      const state = get();
      if (!trimmed || state.busy || !client) return;
      const activeClient = client;

      const cmdHistory =
        state.cmdHistory[state.cmdHistory.length - 1] === trimmed
          ? state.cmdHistory
          : [...state.cmdHistory, trimmed];

      const assistantId = newId();
      activeAssistantId = assistantId;
      needsSeparator = false;

      set({
        busy: true,
        cmdHistory,
        messages: [
          ...state.messages,
          { id: newId(), kind: 'user', content: trimmed },
          { id: assistantId, kind: 'assistant', text: '', tools: [] },
        ],
      });

      const request = {
        message: trimmed,
        ...(state.session?.session_id ? { session_id: state.session.session_id } : {}),
        ...(state.catalogMode === 'general'
          ? { hostname: state.catalog.hostname.trim(), catalog_id: state.catalog.catalogId.trim() }
          : {}),
      };

      handle = activeClient.sendMessage(request, (event) => {
        switch (event.type) {
          case 'status':
            patchAssistant(assistantId, (m) => ({ ...m, status: event.message }));
            break;
          case 'text':
            patchAssistant(assistantId, (m) => {
              let value = m.text;
              if (needsSeparator && value) value += /[.!?:]\s*$/.test(value) ? '\n\n' : ' ';
              return { ...m, status: undefined, text: value + event.chunk };
            });
            needsSeparator = false;
            break;
          case 'tool_start':
            patchAssistant(assistantId, (m) => ({
              ...m,
              status: undefined,
              tools: [...m.tools, { id: newId(), name: event.name, input: event.input, status: 'running' }],
            }));
            break;
          case 'tool_end':
            patchAssistant(assistantId, (m) => {
              const tools = [...m.tools];
              for (let i = tools.length - 1; i >= 0; i--) {
                if (tools[i].name === event.name && tools[i].status === 'running') {
                  tools[i] = { ...tools[i], status: 'done', result: event.result };
                  break;
                }
              }
              return { ...m, tools };
            });
            needsSeparator = true;
            break;
          case 'error': {
            const authIssue = event.error === 'auth' || event.error === 'session_expired';
            if (authIssue) {
              const expired = event.error === 'session_expired' || isAuthenticated(get().session);
              set({ authState: expired ? 'expired' : 'logged_out' });
            } else {
              set({ error: event.detail || 'The assistant ran into an error.' });
            }
            finalize();
            break;
          }
          case 'done':
            finalize();
            break;
        }
      });
    },

    stop: () => {
      if (handle) handle.abort();
      if (activeAssistantId) {
        patchAssistant(activeAssistantId, (m) =>
          m.text ? { ...m, text: m.text + '\n\n*[stopped]*', stopped: true } : m,
        );
      }
      finalize();
    },

    clearHistory: async () => {
      if (client) await client.clearHistory();
      set({ messages: [], cmdHistory: [] });
    },

    toggleRagMode: async () => {
      if (!client) return;
      const enabling = !get().ragModeActive;
      try {
        const result = await client.setRagMode(enabling);
        set({ ragModeActive: result.rag_mode_active });
      } catch {
        /* leave state unchanged on network error */
      }
    },

    setCatalog: (patch) => set((s) => ({ catalog: { ...s.catalog, ...patch } })),

    clearError: () => set({ error: null }),
  };
});
