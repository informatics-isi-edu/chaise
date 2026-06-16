import { type JSX } from 'react';
import { useChatStore } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';

/**
 * Composer-bar controls: the RAG (search-only) toggle when the backend offers
 * it, and a New-chat action once there are messages. Rendered to the left of
 * the Send button.
 */
const ChatToolbar = (): JSX.Element | null => {
  const ragToggleAvailable = useChatStore((s) => s.ragToggleAvailable);
  const ragModeActive = useChatStore((s) => s.ragModeActive);
  const toggleRagMode = useChatStore((s) => s.toggleRagMode);
  const clearHistory = useChatStore((s) => s.clearHistory);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  if (!ragToggleAvailable && !hasMessages) return null;

  return (
    <div className='chat-toolbar'>
      {ragToggleAvailable && (
        <label className='chat-rag-toggle' title='Search documentation only, without AI-generated answers'>
          <input type='checkbox' checked={ragModeActive} onChange={() => void toggleRagMode()} />
          Search-only mode
        </label>
      )}
      {hasMessages && (
        <button type='button' className='chaise-btn chaise-btn-tertiary chat-new-chat' onClick={() => void clearHistory()}>
          New chat
        </button>
      )}
    </div>
  );
};

export default ChatToolbar;
