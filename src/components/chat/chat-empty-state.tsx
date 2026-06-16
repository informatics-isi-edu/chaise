import { type JSX } from 'react';
import { useChatStore } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';

const SUGGESTIONS = [
  'What can you do?',
  'What tables are in this catalog?',
  'Summarize the schema of this catalog',
];

/**
 * Centered welcome shown when the conversation is empty: a short intro plus a
 * few starter prompts that send on click.
 */
const ChatEmptyState = (): JSX.Element => {
  const send = useChatStore((s) => s.send);
  const busy = useChatStore((s) => s.busy);

  return (
    <div className='chat-empty'>
      <h2 className='chat-empty-title'>DERIVA Assistant</h2>
      <p className='chat-empty-subtitle'>
        Ask about this catalog&apos;s data, schema, or documentation.
      </p>
      <div className='chat-empty-suggestions'>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type='button'
            className='chaise-btn chaise-btn-secondary chat-suggestion'
            disabled={busy}
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatEmptyState;
