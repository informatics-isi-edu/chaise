import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';
import '@isrd-isi-edu/chaise/src/assets/scss/_scrollbar.scss';

import { useRef, type JSX } from 'react';

// components
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

export interface ModelChecklistItem {
  id: string;
  label: string;
}

interface ModelChecklistProps {
  title: string;
  items: ModelChecklistItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage: string;
  /**
   * added to the container, so each list can get its own height treatment
   */
  className?: string;
}

interface ModelChecklistRowProps {
  item: ModelChecklistItem;
  checked: boolean;
  onToggle: (id: string) => void;
}

const ModelChecklistRow = ({ item, checked, onToggle }: ModelChecklistRowProps): JSX.Element => {
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
const ModelChecklist = ({ title, items, checkedIds, onToggle, emptyMessage, className }: ModelChecklistProps): JSX.Element => {
  return (
    <div className={`model-checklist-container${className ? ` ${className}` : ''}`}>
      <div className='model-checklist-title'>{title}</div>
      {items.length === 0 ? (
        <div className='model-checklist-empty'>{emptyMessage}</div>
      ) : (
        <ul className='chaise-list-container model-checklist chaise-scrollbar-y'>
          {items.map((item) => (
            <ModelChecklistRow key={item.id} item={item} checked={checkedIds.has(item.id)} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModelChecklist;
