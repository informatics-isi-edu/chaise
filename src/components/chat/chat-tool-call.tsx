import { type JSX } from 'react';
import type { ToolCallState } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';

const ChatToolCall = ({ tool }: { tool: ToolCallState }): JSX.Element => (
  <details className='tool-call' data-tool-name={tool.name}>
    <summary className='tool-call-summary'>
      <code>{tool.name}</code>
      <span className='tool-call-status'>{tool.status}</span>
    </summary>
    {tool.input !== undefined && (
      <div className='tool-call-section'>
        <div className='tool-call-label'>Input</div>
        <pre>{JSON.stringify(tool.input, null, 2)}</pre>
      </div>
    )}
    {tool.result !== undefined && (
      <div className='tool-call-section'>
        <div className='tool-call-label'>Result</div>
        <pre>{tool.result}</pre>
      </div>
    )}
  </details>
);

export default ChatToolCall;
