import { useEffect, useRef, type JSX } from 'react';
import type { ChatMessage } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';
import { renderChatMarkdown } from '@isrd-isi-edu/chaise/src/utils/chat-markdown';
import ChatToolCall from '@isrd-isi-edu/chaise/src/components/chat/chat-tool-call';

const LoadingDots = (): JSX.Element => (
  <span className='loading-dots'>
    <span />
    <span />
    <span />
  </span>
);

const AssistantText = ({ text }: { text: string }): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = renderChatMarkdown(text);
    if (html === null) {
      el.textContent = text;
    } else {
      // ermrestjs sanitises its Markdown output.
      el.innerHTML = html;
    }
  }, [text]);
  return <div className='msg-text markdown-container' ref={ref} />;
};

const ChatMessageView = ({ message, streaming }: { message: ChatMessage; streaming: boolean }): JSX.Element => {
  if (message.kind === 'user') {
    return <div className='msg msg-user'>{message.content}</div>;
  }

  const toolLabel = `Used ${message.tools.length} tool${message.tools.length !== 1 ? 's' : ''}`;
  return (
    <div className='msg msg-assistant'>
      {message.tools.length > 0 && (
        <details className='msg-tools-container'>
          <summary className='msg-tools-container-summary'>{toolLabel}</summary>
          <div className='msg-tools'>
            {message.tools.map((tool) => (
              <ChatToolCall key={tool.id} tool={tool} />
            ))}
          </div>
        </details>
      )}
      {message.status && <div className='msg-status'>{message.status}</div>}
      {message.text && <AssistantText text={message.text} />}
      {streaming && (
        <div className='msg-thinking'>
          <LoadingDots />
        </div>
      )}
    </div>
  );
};

export default ChatMessageView;
