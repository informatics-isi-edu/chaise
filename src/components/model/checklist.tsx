import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';
import '@isrd-isi-edu/chaise/src/assets/scss/_scrollbar.scss';

import { useMemo, useRef, type JSX } from 'react';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

/**
 * a search box only shows on lists with at least this many items
 */
const MIN_ITEMS_FOR_SEARCH = 10;

export interface ModelChecklistItem {
  id: string;
  label: string;
  /**
   * when set, the item can't be toggled and this explains why in its tooltip
   */
  disabledReason?: string;
}

interface ModelChecklistProps {
  title: string;
  /**
   * singular and plural nouns for the items (e.g. 'table', 'tables'), used in the
   * summary line, search placeholder and button tooltips
   */
  itemName: string;
  itemsName: string;
  items: ModelChecklistItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  /**
   * when given, show all / hide all buttons are added. called with only the listed,
   * enabled items whose state actually changes, and never with an empty list.
   */
  onSetMany?: (ids: string[], checked: boolean) => void;
  /**
   * when onFilterTextChange is given, a search box filters the listed items once
   * there are at least MIN_ITEMS_FOR_SEARCH of them. the text is owned by the
   * parent so it survives this list unmounting with the toolbar.
   */
  filterText?: string;
  onFilterTextChange?: (filterText: string) => void;
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
  const { disabledReason } = item;

  // a disabled row always explains itself; other rows only show the full label when it's cut off
  const tooltip = disabledReason
    ? (isOverflowing: boolean) => (
      // italic, so the reason doesn't read as part of the name
      isOverflowing ? <>{item.label}<br /><i>{disabledReason}</i></> : <i>{disabledReason}</i>
    )
    : item.label;

  return (
    <li className='chaise-checkbox ellipsis-text'>
      <input type='checkbox' checked={checked} disabled={!!disabledReason} onChange={() => onToggle(item.id)} />
      <EllipsisWrapper tooltip={tooltip} elementRef={labelRef} placement='right'>
        <label ref={labelRef}>{item.label}</label>
      </EllipsisWrapper>
    </li>
  );
};

/**
 * flat list of checkboxes, used for both the schema and table visibility
 * controls. reuses chaise's existing checkbox list styling and ellipsis +
 * tooltip pattern (see faceting/facet-check-list.tsx) rather than a new
 * dependency. the search box, summary line and show/hide buttons follow the
 * viewer's annotation list.
 */
const ModelChecklist = ({
  title,
  itemName,
  itemsName,
  items,
  checkedIds,
  onToggle,
  onSetMany,
  filterText = '',
  onFilterTextChange,
  emptyMessage,
  className,
}: ModelChecklistProps): JSX.Element => {
  // kept while there's text, so a filter can't apply with no visible box
  const showSearch = !!onFilterTextChange && (items.length >= MIN_ITEMS_FOR_SEARCH || filterText !== '');

  const listedItems = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.label.toLowerCase().includes(term));
  }, [items, filterText]);

  const checkedCount = useMemo(() => items.filter((item) => checkedIds.has(item.id)).length, [items, checkedIds]);

  const listedCheckedCount = useMemo(
    () => listedItems.filter((item) => checkedIds.has(item.id)).length,
    [listedItems, checkedIds]
  );

  /**
   * show or hide every listed item that can change. a click that changes nothing
   * must not reach the parent: a new but equal set would still trigger a relayout.
   */
  const setListed = (checked: boolean) => {
    if (!onSetMany) return;
    const ids = listedItems
      .filter((item) => !item.disabledReason && checkedIds.has(item.id) !== checked)
      .map((item) => item.id);
    if (ids.length > 0) onSetMany(ids, checked);
  };

  // same wording as the viewer's annotation list
  const singular = listedCheckedCount === 1;
  const displayedTooltip = [
    `${listedCheckedCount} ${singular ? itemName : itemsName} in the search list `,
    checkedCount !== listedCheckedCount ? `(${checkedCount} total) ` : '',
    `${singular ? 'is' : 'are'} displayed in the diagram.`,
  ].join('');

  const renderSummary = () => (
    <div className='model-checklist-summary'>
      <span className='model-checklist-summary-text'>
        <span>Found {listedItems.length} of {items.length} </span>
        <ChaiseTooltip placement='right' tooltip={<span>{displayedTooltip}</span>}>
          <span className='chaise-icon-for-tooltip'>({listedCheckedCount} Displayed)</span>
        </ChaiseTooltip>
      </span>
      {onSetMany && (
        <div className='chaise-btn-group'>
          <ChaiseTooltip tooltip={`Show all listed ${itemsName}`} placement='bottom'>
            <button
              type='button'
              className='model-checklist-show-all chaise-btn chaise-btn-secondary'
              onClick={() => setListed(true)}
              disabled={listedItems.length === 0}
            >
              <span className='fa-solid fa-eye' />
            </button>
          </ChaiseTooltip>
          <ChaiseTooltip tooltip={`Hide all listed ${itemsName}`} placement='bottom'>
            <button
              type='button'
              className='model-checklist-hide-all chaise-btn chaise-btn-secondary'
              onClick={() => setListed(false)}
              disabled={listedItems.length === 0}
            >
              <span className='fa-solid fa-eye-slash' />
            </button>
          </ChaiseTooltip>
        </div>
      )}
    </div>
  );

  const renderList = () => {
    if (listedItems.length === 0) {
      return <div className='model-checklist-empty'>No {itemsName} match &ldquo;{filterText}&rdquo;.</div>;
    }
    return (
      <ul className='chaise-list-container model-checklist chaise-scrollbar-y'>
        {listedItems.map((item) => (
          <ModelChecklistRow key={item.id} item={item} checked={checkedIds.has(item.id)} onToggle={onToggle} />
        ))}
      </ul>
    );
  };

  return (
    <div className={`model-checklist-container${className ? ` ${className}` : ''}`}>
      <div className='model-checklist-title'>{title}</div>
      {/* same markup as the viewer's annotation search, which also filters as you type */}
      {showSearch && onFilterTextChange && (
        <div className='model-checklist-search chaise-search-box chaise-input-group'>
          <div className='chaise-input-control has-feedback'>
            <input
              type='text'
              placeholder={`Search ${itemsName}`}
              value={filterText}
              onChange={(event) => onFilterTextChange(event.target.value)}
            />
            <ClearInputBtn
              btnClassName='remove-search-btn'
              clickCallback={() => onFilterTextChange('')}
              show={!!filterText}
            />
          </div>
          <div className='chaise-input-group-append'>
            <ChaiseTooltip placement='bottom-start' tooltip={`Search any keyword to filter ${itemsName}`}>
              <button type='button' className='chaise-search-btn chaise-btn chaise-btn-primary'>
                <span className='chaise-btn-icon fa-solid fa-magnifying-glass' />
              </button>
            </ChaiseTooltip>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <div className='model-checklist-empty'>{emptyMessage}</div>
      ) : (
        <>
          {(onSetMany || showSearch) && renderSummary()}
          {renderList()}
        </>
      )}
    </div>
  );
};

export default ModelChecklist;
