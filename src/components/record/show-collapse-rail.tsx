// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ExpandIcon from '@isrd-isi-edu/chaise/src/components/icons/expand';
import CollapseIcon from '@isrd-isi-edu/chaise/src/components/icons/collapse';

// hooks
import useShowMoreStore from '@isrd-isi-edu/chaise/src/hooks/record-show-more';

// utils
import { collapseAndScrollToRowTop } from '@isrd-isi-edu/chaise/src/utils/record-utils';

import type { JSX } from 'react';

/**
 * Vertical rail rendered in the entity-key cell, spanning below the column name
 * to the bottom of the cell with the show/collapse icon centered on it.
 * Visible only on row hover (see _record-main-section.scss). Renders nothing
 * when the row's value isn't overflowing. Collapsing also scrolls the row
 * back to the top of `.main-container` (see `collapseAndScrollToRowTop`).
 *
 * Must be rendered inside `ShowMoreRowProvider`.
 */
const ShowCollapseRail = (): JSX.Element | null => {
  const expanded = useShowMoreStore((state) => state.expanded);
  const overflowing = useShowMoreStore((state) => state.overflowing);
  const setExpanded = useShowMoreStore((state) => state.setExpanded);
  if (!overflowing) return null;
  const Icon = expanded ? CollapseIcon : ExpandIcon;
  const label = expanded ? 'Show less' : 'Show all content';
  return (
    <ChaiseTooltip placement='left' tooltip={label}>
      <button
        type='button'
        aria-label={label}
        className='record-show-collapse-rail record-show-collapse-button'
        onClick={(e) => {
          if (expanded) {
            collapseAndScrollToRowTop(e.currentTarget, setExpanded);
          } else {
            setExpanded(true);
          }
        }}
      >
        <span className='record-show-collapse-rail-line' aria-hidden='true' />
        <span
          className={`record-show-collapse-rail-cap record-show-collapse-rail-cap-top fa-solid ${expanded ? 'fa-chevron-down' : 'fa-chevron-up'}`}
          aria-hidden='true'
        />
        <Icon className='record-show-collapse-rail-icon' width={25} />
        <span
          className={`record-show-collapse-rail-cap record-show-collapse-rail-cap-bottom fa-solid ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}
          aria-hidden='true'
        />
      </button>
    </ChaiseTooltip>
  );
};

export default ShowCollapseRail;
