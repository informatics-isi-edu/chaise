// hooks
import useShowMoreStore from '@isrd-isi-edu/chaise/src/hooks/record-show-more';

// utils
import { collapseAndScrollToRowTop } from '@isrd-isi-edu/chaise/src/utils/record-utils';

import { useLayoutEffect, useRef, type JSX, type ReactNode } from 'react';

/**
 * Wraps a value with show-more clipping, a fade-out gradient, and the inline
 * "... more/less" toggle. Overflow is detected with a native ResizeObserver
 * against the content's natural scrollHeight. The actual show/collapse control
 * is the rail in the entity-key cell (see `ShowCollapseRail`).
 *
 * Must be rendered inside `ShowMoreRowProvider` (rows without a valid
 * `visible_cell_height` render their value directly instead).
 */
const ShowMoreValue = ({ children }: { children: ReactNode }): JSX.Element => {
  const expanded = useShowMoreStore((state) => state.expanded);
  const overflowing = useShowMoreStore((state) => state.overflowing);
  const maxHeight = useShowMoreStore((state) => state.maxHeight);
  const setExpanded = useShowMoreStore((state) => state.setExpanded);
  const setOverflowing = useShowMoreStore((state) => state.setOverflowing);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // scrollHeight is the natural content height even when the element is clipped
    const check = () => setOverflowing(el.scrollHeight > maxHeight + 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, maxHeight, setOverflowing]);

  return (
    <div className='record-show-more-value'>
      <div
        ref={contentRef}
        className={`record-show-more-content${expanded ? ' expanded' : ''}`}
        // max-height is set inline (not in SCSS) so the threshold can come from
        // the per-column annotation. `expanded` removes the cap entirely.
        style={expanded ? undefined : { maxHeight: `${maxHeight}px` }}
      >
        {children}
        {!expanded && overflowing && <div className='record-show-more-fade' />}
      </div>

      {overflowing && (
        <span className='record-show-more-link'>
          {' ... '}
          <span
            className='text-primary readmore'
            onClick={(e) => {
              if (expanded) {
                collapseAndScrollToRowTop(e.currentTarget, setExpanded);
              } else {
                setExpanded(true);
              }
            }}
          >
            {expanded ? 'less' : 'more'}
          </span>
        </span>
      )}
    </div>
  );
};

export default ShowMoreValue;
