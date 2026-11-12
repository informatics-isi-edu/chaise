import Dropdown from 'react-bootstrap/Dropdown';
import { memo, useEffect, useMemo, useRef, useState, type JSX } from 'react';

// components
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';
import SimpleSearchDropdownMenu from '@isrd-isi-edu/chaise/src/components/simple-search-dropdown/simple-search-dropdown-menu';
import SimpleSearchDropdownOption from '@isrd-isi-edu/chaise/src/components/simple-search-dropdown/simple-search-dropdown-option';

/**
 * event key of the whole-catalog item; table ids are `schema:table`, so it can't collide with one
 */
const ALL_TABLES_KEY = 'all-tables';

const ALL_TABLES_LABEL = 'Catalog (All tables)';

/**
 * the toggle's value on one line with an ellipsis; like the checklist rows, the full
 * name shows in a tooltip only when it's cut off
 */
const ScopeLabel = ({ label }: { label: string }): JSX.Element => {
  const labelRef = useRef<HTMLSpanElement>(null);
  return (
    <EllipsisWrapper tooltip={label} elementRef={labelRef} placement='right'>
      <span ref={labelRef} className='model-scope-dropdown-label'>
        {label}
      </span>
    </EllipsisWrapper>
  );
};

interface ModelScopeDropdownProps {
  /**
   * id of the visible label, which names the toggle together with its value
   */
  labelId: string;
  /**
   * every table in the catalog's diagram, as `schema:table` ids, in display order
   */
  tableIds: string[];
  /**
   * the table whose neighbors are shown, or null for all tables
   */
  focusTableId: string | null;
  onSelect: (tableId: string | null) => void;
}

/**
 * picks what the diagram shows: all tables, or one table and its neighbors. the menu is a
 * SimpleSearchDropdownMenu, like the foreign key dropdown's, filtering a list that's
 * already loaded as you type.
 */
const ModelScopeDropdown = ({ labelId, tableIds, focusTableId, onSelect }: ModelScopeDropdownProps): JSX.Element => {
  const [show, setShow] = useState(false);
  const [filterText, setFilterText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const term = filterText.trim().toLowerCase();
  const listedTableIds = useMemo(
    () => (term ? tableIds.filter((id) => id.toLowerCase().includes(term)) : tableIds),
    [tableIds, term]
  );
  // the whole-catalog option is the list's first row, filtered like the rest
  const listsCatalog = !term || ALL_TABLES_LABEL.toLowerCase().includes(term);

  /*
   * the menu is mounted by the time this runs, but popper hasn't placed it yet: it still
   * overflows the settings panel, and a plain focus() would scroll the panel sideways
   */
  useEffect(() => {
    if (show) searchInputRef.current?.focus({ preventScroll: true });
  }, [show]);

  const onToggle = (nextShow: boolean) => {
    setShow(nextShow);
    if (!nextShow) setFilterText('');
  };

  return (
    <Dropdown
      className='chaise-dropdown model-scope-dropdown'
      show={show}
      onToggle={onToggle}
      onSelect={(key) => onSelect(key === ALL_TABLES_KEY ? null : key)}
      // the search box takes focus instead of the first item
      focusFirstItemOnShow={false}
      // the menu's right edge on the toggle's, which is the panel's inner edge, so it fits the panel
      align='end'
    >
      <Dropdown.Toggle id='model-scope-toggle' aria-labelledby={`${labelId} model-scope-toggle`} className='chaise-btn chaise-btn-secondary'>
        <ScopeLabel label={focusTableId ?? ALL_TABLES_LABEL} />
      </Dropdown.Toggle>
      <SimpleSearchDropdownMenu
        className='model-scope-dropdown-menu'
        // a live filter, so no search button (the panel is too narrow for one anyway)
        searchBox={
          <div className='chaise-search-box chaise-input-group'>
            <div className='chaise-input-group-prepend'>
              {/* the icon gets its own span: font awesome 7 gives .fa-solid a 1.25em width, too narrow for the addon's padding */}
              <span className='chaise-input-group-text'>
                <span className='fa-solid fa-magnifying-glass' />
              </span>
            </div>
            <div className='chaise-input-control has-feedback'>
              <input
                ref={searchInputRef}
                type='text'
                placeholder='Search tables'
                aria-label='Search tables'
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
              />
              <ClearInputBtn btnClassName='remove-search-btn' clickCallback={() => setFilterText('')} show={!!filterText} />
            </div>
          </div>
        }
        noResults={!listsCatalog && listedTableIds.length === 0}
      >
        {listsCatalog && (
          <SimpleSearchDropdownOption
            eventKey={ALL_TABLES_KEY}
            label={ALL_TABLES_LABEL}
            isSelected={focusTableId === null}
            className='model-scope-dropdown-all'
          />
        )}
        {listedTableIds.map((id) => (
          <SimpleSearchDropdownOption key={id} eventKey={id} label={id} isSelected={id === focusTableId} />
        ))}
      </SimpleSearchDropdownMenu>
    </Dropdown>
  );
};

// the menu stays mounted after its first open, so skip re-rendering every option on each diagram render
export default memo(ModelScopeDropdown);
