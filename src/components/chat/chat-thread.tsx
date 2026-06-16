import { useEffect, useRef, type JSX } from 'react';
import { useChatStore } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';
import ChatMessageView from '@isrd-isi-edu/chaise/src/components/chat/chat-message';
import ChatEmptyState from '@isrd-isi-edu/chaise/src/components/chat/chat-empty-state';

const ChatThread = (): JSX.Element => {
  const messages = useChatStore((s) => s.messages);
  const busy = useChatStore((s) => s.busy);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  let streamingId: string | null = null;
  if (busy) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].kind === 'assistant') {
        streamingId = messages[i].id;
        break;
      }
    }
  }

  return (
    <div className='chat-thread-scroller' ref={scroller}>
      {messages.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <div className='chat-thread'>
          {messages.map((message) => (
            <ChatMessageView key={message.id} message={message} streaming={message.id === streamingId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatThread;
