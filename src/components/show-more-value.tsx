import '@isrd-isi-edu/chaise/src/assets/scss/_show-more-value.scss';

import { type JSX, type MouseEvent, type ReactNode, type Ref } from 'react';

type ShowMoreValueProps = {
  /** whether the value is expanded (the height cap is removed) */
  expanded: boolean;
  /** whether the content overflows the cap (controls the fade and the toggle) */
  overflowing: boolean;
  /** clip threshold (px) applied while not expanded */
  maxHeight: number;
  /**
   * toggles expand/collapse. The click event is passed so callers can locate
   * the row (e.g. the record page scrolls back to the row top on collapse).
   */
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  /** optional ref to the clip element, for callers that observe its size */
  contentRef?: Ref<HTMLDivElement>;
  /** extra class on the outer wrapper */
  className?: string;
  children: ReactNode;
};

/**
 * Presentational show more/less wrapper: clips its content to `maxHeight`, fades
 * the bottom (via a mask, so it works on any background), and renders the inline
 * `... more/less` toggle when `overflowing`. State and overflow detection are
 * owned by the caller (see `RecordShowMoreValue` and the recordset `TableRow`).
 */
const ShowMoreValue = ({
  expanded,
  overflowing,
  maxHeight,
  onToggle,
  contentRef,
  className,
  children,
}: ShowMoreValueProps): JSX.Element => {
  return (
    <div className={`show-more-value${className ? ` ${className}` : ''}`}>
      <div
        ref={contentRef}
        className={
          'show-more-content' +
          (expanded ? ' expanded' : '') +
          (!expanded && overflowing ? ' show-more-faded' : '')
        }
        // max-height is set inline so the threshold can be data-driven (per-column
        // annotation in record, chaise-config in recordset).
        style={expanded ? undefined : { maxHeight: `${maxHeight}px` }}
      >
        {children}
      </div>

      {overflowing && (
        <span className='show-more-link'>
          {' ... '}
          <button type='button' className='text-primary readmore' onClick={onToggle}>
            {expanded ? 'less' : 'more'}
          </button>
        </span>
      )}
    </div>
  );
};

export default ShowMoreValue;
