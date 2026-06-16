import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from 'react';
import { useChatStore } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';
import ChatToolbar from '@isrd-isi-edu/chaise/src/components/chat/chat-toolbar';
import ExpandIcon from '@isrd-isi-edu/chaise/src/components/icons/expand';
import CollapseIcon from '@isrd-isi-edu/chaise/src/components/icons/collapse';

const ChatInput = (): JSX.Element => {
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);
  const busy = useChatStore((s) => s.busy);
  const ragModeActive = useChatStore((s) => s.ragModeActive);
  const cmdHistory = useChatStore((s) => s.cmdHistory);

  const [value, setValue] = useState('');
  const [historyPos, setHistoryPos] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to the CSS max-height while collapsed. When expanded, the
  // textarea is sized by flex (CSS), so clear the inline height. Also track
  // whether the content spans more than one line (newline or wrap) -- the
  // expand toggle only appears once it does, like Gemini.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (expanded) {
      el.style.height = '';
      return;
    }
    el.style.height = 'auto';
    const contentHeight = el.scrollHeight;
    el.style.height = `${contentHeight}px`;
    const cs = getComputedStyle(el);
    const singleLine =
      parseFloat(cs.lineHeight) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    setMultiline(contentHeight > singleLine + 1);
  }, [value, expanded]);

  const showToggle = expanded || multiline;

  const submit = (): void => {
    if (!value.trim() || busy) return;
    send(value);
    setValue('');
    setHistoryPos(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'ArrowUp' && (value === '' || historyPos >= 0) && cmdHistory.length) {
      e.preventDefault();
      const next = historyPos < 0 ? cmdHistory.length - 1 : Math.max(0, historyPos - 1);
      setHistoryPos(next);
      setValue(cmdHistory[next]);
      return;
    }
    if (e.key === 'ArrowDown' && historyPos >= 0) {
      e.preventDefault();
      const next = historyPos + 1;
      if (next >= cmdHistory.length) {
        setHistoryPos(-1);
        setValue('');
      } else {
        setHistoryPos(next);
        setValue(cmdHistory[next]);
      }
    }
  };

  return (
    <div className='chat-input-area'>
      <div
        className={
          `chat-composer${expanded ? ' chat-composer-expanded' : ''}` +
          (showToggle ? ' chat-composer-has-toggle' : '')
        }
      >
        {showToggle && (
          <button
            type='button'
            className='chaise-btn chaise-btn-tertiary chat-expand-btn'
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
            title={expanded ? 'Collapse input' : 'Expand input'}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        )}
        <textarea
          className='chat-input'
          ref={ref}
          rows={1}
          placeholder={ragModeActive ? 'Enter search terms...' : 'Ask a question...'}
          aria-label='Message'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className='chat-composer-bar'>
          <ChatToolbar />
          <div className='chat-composer-send'>
            {busy ? (
              <button type='button' className='chaise-btn chaise-btn-secondary' onClick={stop}>
                Stop
              </button>
            ) : (
              <button type='button' className='chaise-btn chaise-btn-primary' onClick={submit} disabled={!value.trim()}>
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
