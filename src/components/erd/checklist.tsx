import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';
import '@isrd-isi-edu/chaise/src/assets/scss/_scrollbar.scss';

import { useRef, type JSX } from 'react';

// components
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

export interface ErdChecklistItem {
  id: string;
  label: string;
}

interface ErdChecklistProps {
  title: string;
  items: ErdChecklistItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage: string;
}

interface ErdChecklistRowProps {
  item: ErdChecklistItem;
  checked: boolean;
  onToggle: (id: string) => void;
}

const ErdChecklistRow = ({ item, checked, onToggle }: ErdChecklistRowProps): JSX.Element => {
  const labelRef = useRef<HTMLLabelElement>(null);

  return (
    <li className='chaise-checkbox ellipsis-text'>
      <input type='checkbox' checked={checked} onChange={() => onToggle(item.id)} />
      <EllipsisWrapper tooltip={item.label} elementRef={labelRef} placement='right'>
        <label ref={labelRef}>{item.label}</label>
      </EllipsisWrapper>
    </li>
  );
};

/**
 * flat list of checkboxes, used for both the schema and table visibility
 * controls. reuses chaise's existing checkbox list styling and ellipsis +
 * tooltip pattern (see faceting/facet-check-list.tsx) rather than a new
 * dependency.
 */
const ErdChecklist = ({ title, items, checkedIds, onToggle, emptyMessage }: ErdChecklistProps): JSX.Element => {
  return (
    <div className='erd-checklist-container'>
      <div className='erd-checklist-title'>{title}</div>
      {items.length === 0 ? (
        <div className='erd-checklist-empty'>{emptyMessage}</div>
      ) : (
        <ul className='chaise-list-container erd-checklist chaise-scrollbar-y'>
          {items.map((item) => (
            <ErdChecklistRow key={item.id} item={item} checked={checkedIds.has(item.id)} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ErdChecklist;
