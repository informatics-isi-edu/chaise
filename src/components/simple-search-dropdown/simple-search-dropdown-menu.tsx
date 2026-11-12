import '@isrd-isi-edu/chaise/src/assets/scss/_simple-search-dropdown.scss';

import Dropdown from 'react-bootstrap/Dropdown';
import { type JSX, type ReactNode, type Ref } from 'react';

type SimpleSearchDropdownMenuProps = {
  /**
   * placed in the search row: e.g. SearchInput for a server search, or a plain input for a live filter
   */
  searchBox: JSX.Element;
  /**
   * the options, normally SimpleSearchDropdownOption elements
   */
  children?: ReactNode;
  /**
   * show the "No Results" row instead of the options; set it only once the first load is done
   */
  noResults?: boolean;
  /**
   * the last row inside the scrolling list, e.g. "load more"
   */
  footer?: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  flip?: boolean;
};

/**
 * the inside of an open "simple search dropdown", named after the selector_ux_mode value: the
 * search box, then the scrolling list of options. callers own the
 * toggle, the data and how searching works; this owns where things go and how they look.
 */
const SimpleSearchDropdownMenu = ({
  searchBox,
  children,
  noResults,
  footer,
  className,
  ref,
  flip,
}: SimpleSearchDropdownMenuProps): JSX.Element => (
  <Dropdown.Menu ref={ref} flip={flip} className={`simple-search-dropdown-menu${className ? ` ${className}` : ''}`}>
    {/* search-row, dropdown-list and no-results come from the foreign key dropdown; recordedit's e2e locators use them */}
    <li className='search-row'>{searchBox}</li>
    <div className='dropdown-list'>
      {noResults ? (
        // not a Dropdown.Item, so it can't be selected
        <li className='dropdown-item no-results'>
          <span className='simple-search-dropdown-check fa-solid fa-check simple-search-dropdown-check-hidden' />
          <span className='simple-search-dropdown-label'>
            <span className='dropdown-select-value'><i>No Results</i></span>
          </span>
        </li>
      ) : children}
      {footer}
    </div>
  </Dropdown.Menu>
);

export default SimpleSearchDropdownMenu;
