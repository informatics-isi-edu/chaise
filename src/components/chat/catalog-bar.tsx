import { type JSX } from 'react';
import { useChatStore } from '@isrd-isi-edu/chaise/src/hooks/use-chat-store';

const CatalogBar = (): JSX.Element | null => {
  const mode = useChatStore((s) => s.catalogMode);
  const catalog = useChatStore((s) => s.catalog);
  const setCatalog = useChatStore((s) => s.setCatalog);
  if (mode !== 'general') return null;

  return (
    <div className='chat-catalog-bar'>
      <label>
        Hostname{' '}
        <input
          type='text'
          placeholder='e.g. facebase.org'
          value={catalog.hostname}
          onChange={(e) => setCatalog({ hostname: e.target.value })}
        />
      </label>
      <label>
        Catalog ID{' '}
        <input
          type='text'
          placeholder='e.g. 1'
          value={catalog.catalogId}
          onChange={(e) => setCatalog({ catalogId: e.target.value })}
        />
      </label>
    </div>
  );
};

export default CatalogBar;
