// components
import ShowMoreValue from '@isrd-isi-edu/chaise/src/components/show-more-value';

// hooks
import useShowMoreStore from '@isrd-isi-edu/chaise/src/hooks/record-show-more';

// utils
import { collapseAndScrollToRowTop } from '@isrd-isi-edu/chaise/src/utils/record-utils';

import { useLayoutEffect, useRef, type JSX, type ReactNode } from 'react';

/**
 * Record-page adapter that binds the shared `ShowMoreValue` to the per-row
 * zustand store. Symmetric with `ShowCollapseRail`: that reads the store for the
 * entity-key cell, this one for the value cell. Owns the overflow detection
 * (ResizeObserver against the per-column `visibleCellHeight`) and the
 * scroll-back-on-collapse behavior.
 *
 * Must be rendered inside `ShowMoreRowProvider` (rows without a valid
 * `visible_cell_height` render their value directly instead).
 */
const RecordShowMoreValue = ({ children }: { children: ReactNode }): JSX.Element => {
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
    <ShowMoreValue
      expanded={expanded}
      overflowing={overflowing}
      maxHeight={maxHeight}
      contentRef={contentRef}
      onToggle={(e) => {
        if (expanded) {
          collapseAndScrollToRowTop(e.currentTarget, setExpanded);
        } else {
          setExpanded(true);
        }
      }}
    >
      {children}
    </ShowMoreValue>
  );
};

export default RecordShowMoreValue;
