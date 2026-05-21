import '@isrd-isi-edu/chaise/src/assets/scss/_record-main-section.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Spinner from 'react-bootstrap/Spinner';
import FilePreview from '@isrd-isi-edu/chaise/src/components/file-preview';
import ExpandIcon from '@isrd-isi-edu/chaise/src/components/icons/expand';
import CollapseIcon from '@isrd-isi-edu/chaise/src/components/icons/collapse';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { RecordColumnModel } from '@isrd-isi-edu/chaise/src/models/record';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { canShowInlineRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type JSX,
  type ReactNode,
  type SetStateAction,
} from 'react';

// Single source of truth for the show-more clip threshold. Applied as inline
// `max-height` on `.record-show-more-content` AND compared against `scrollHeight`
// to decide whether the row is overflowing. Eventually this will come from an
// ermrestjs annotation (per-column), so it has to live in JS land.
const SHOW_MORE_MAX_HEIGHT_PX = 300;

type ShowMoreState = {
  expanded: boolean;
  overflowing: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  setOverflowing: Dispatch<SetStateAction<boolean>>;
};

const ShowMoreContext = createContext<ShowMoreState | null>(null);

const ShowMoreRowProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  return (
    <ShowMoreContext.Provider value={{ expanded, overflowing, setExpanded, setOverflowing }}>
      {children}
    </ShowMoreContext.Provider>
  );
};

const useShowMoreState = (): ShowMoreState => {
  const ctx = useContext(ShowMoreContext);
  if (!ctx) throw new Error('ShowMore components must be inside <ShowMoreRowProvider>');
  return ctx;
};

/**
 * Collapses the row and snaps the viewport to the row's top in the same frame.
 * Measuring + scrolling BEFORE flipping `expanded` works because the row's
 * top position in the document doesn't change when it collapses (only its
 * bottom does). Committing the instant scroll and the state change together
 * lets the browser paint both in a single frame, with no intermediate state
 * where layout has shifted but scroll hasn't caught up.
 *
 * `fromElement` is any element inside the row; we walk up to find the <tr>
 * and the scroll container so the same helper works regardless of where the
 * button is rendered.
 */
const collapseAndScrollToRowTop = (
  fromElement: HTMLElement | null,
  setExpanded: Dispatch<SetStateAction<boolean>>
): void => {
  const row = fromElement?.closest('tr');
  const container = row?.closest<HTMLElement>('.main-container');
  if (row && container) {
    const rowTop = row.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    // leave ~24px above the row so its top border + a bit of breathing room are visible
    const topGap = 24;
    container.scrollBy({ top: rowTop - containerTop - topGap });
  }
  setExpanded(false);
  if (row) {
    // row-focus flash — same timings as scrollToRelatedTable in record.tsx
    setTimeout(() => {
      row.classList.add('row-focus');
      setTimeout(() => row.classList.remove('row-focus'), 1600);
    }, 100);
  }
};

/**
 * Show / Collapse pill rendered below the column name in the entity-key cell.
 * Visible only on row hover (see _record-main-section.scss). Renders nothing
 * when the row's value isn't overflowing. Collapsing also scrolls the row
 * back to the top of `.main-container` (see `collapseAndScrollToRowTop`).
 */
const ShowCollapseButton = (): JSX.Element | null => {
  const { expanded, overflowing, setExpanded } = useShowMoreState();
  if (!overflowing) return null;
  return (
    <button
      type='button'
      aria-label={expanded ? 'Collapse' : 'Show'}
      className='chaise-btn chaise-btn-secondary record-show-more-collapse-btn record-show-collapse-button'
      onClick={(e) => {
        if (expanded) {
          collapseAndScrollToRowTop(e.currentTarget, setExpanded);
        } else {
          setExpanded(true);
        }
      }}
    >
      {expanded ? (
        <CollapseIcon className='chaise-btn-icon' width={16} />
      ) : (
        <ExpandIcon className='chaise-btn-icon' width={16} />
      )}
      <span>{expanded ? 'Collapse' : 'Show'}</span>
    </button>
  );
};

/**
 * Renders the entity-key-side collapse button only when the row's value cell is
 * overflowing; otherwise nothing renders so the `margin-top` on
 * `.record-show-more-entity-key-button` doesn't reserve space on rows that
 * don't need the show-more affordance.
 */
const EntityKeyShowCollapseSlot = (): JSX.Element | null => {
  const { overflowing } = useShowMoreState();
  if (!overflowing) return null;
  return (
    <div className='record-show-more-entity-key-button'>
      <ShowCollapseButton />
    </div>
  );
};

/**
 * Wraps a value with show-more clipping, a fade-out gradient, and the inline
 * "... more/less" toggle. Overflow is detected with a native ResizeObserver
 * against the content's natural scrollHeight. The actual show/collapse pill
 * lives in the entity-key cell (see `EntityKeyShowCollapseSlot`).
 */
const ShowMoreValue = ({ children }: { children: ReactNode }): JSX.Element => {
  const { expanded, overflowing, setExpanded, setOverflowing } = useShowMoreState();
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // scrollHeight is the natural content height even when the element is clipped
    const check = () => setOverflowing(el.scrollHeight > SHOW_MORE_MAX_HEIGHT_PX + 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, setOverflowing]);

  return (
    <div className='record-show-more-value'>
      <div
        ref={contentRef}
        className={`record-show-more-content${expanded ? ' expanded' : ''}`}
        // max-height is set inline (not in SCSS) so the threshold can come from
        // JS — see SHOW_MORE_MAX_HEIGHT_PX. `expanded` removes the cap entirely.
        style={expanded ? undefined : { maxHeight: `${SHOW_MORE_MAX_HEIGHT_PX}px` }}
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

/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = (): JSX.Element => {
  const { errors } = useError();
  const { reference, recordValues, columnModels, showMainSectionSpinner, showEmptySections, page } =
    useRecord();

  const canShow = (columnModel: RecordColumnModel): boolean => {
    // condition evaluated to hide, so should be hidden
    if (columnModel.conditionHide) return false;

    if (columnModel.relatedModel) {
      return canShowInlineRelated(columnModel, showEmptySections);
    } else if (columnModel.requireSecondaryRequest) {
      return (
        showEmptySections ||
        (!!recordValues[columnModel.index] && !!recordValues[columnModel.index].value)
      );
    } else {
      return recordValues[columnModel.index] && recordValues[columnModel.index].value !== null;
    }
  };

  /**
   * Show an error warning if the column is aggregate or inline related table and the data failed to load
   */
  const showError = (cm: RecordColumnModel): boolean => {
    // disable !== checking since cm.relatedModel can be `null` OR `undefined`
    // eslint-disable-next-line eqeqeq
    return (
      cm.hasTimeoutError ||
      (cm.relatedModel != null && cm.relatedModel.recordsetState.hasTimeoutError)
    );
  };

  const showLoader = (cm: RecordColumnModel): boolean => {
    // TODO this is assuming isLoading is also used for the inlines (page.content)
    // disable !== checking since cm.relatedModel can be `null` OR `undefined`
    // eslint-disable-next-line eqeqeq
    return cm.isLoading || (cm.relatedModel != null && cm.relatedModel.recordsetState.isLoading);
  };

  const renderRows = () => {
    const hideAllHeaders = reference.display.hideColumnHeaders;
    return columnModels.map((cm: RecordColumnModel, index: number) => {
      const hideHeader = hideAllHeaders || cm.column.hideColumnHeader;
      const hasTooltip =
        !!cm.column.comment &&
        !!cm.column.comment.value &&
        cm.column.comment.displayMode === CommentDisplayModes.TOOLTIP;
      const hasInlineComment =
        !!cm.column.comment &&
        !!cm.column.comment.value &&
        cm.column.comment.displayMode === CommentDisplayModes.INLINE;
      const hasError = showError(cm);
      const hasInitialized =
        !!cm.relatedModel &&
        cm.relatedModel.tableMarkdownContentInitialized &&
        cm.relatedModel.recordsetState.isInitialized;
      const idSafeDisplayname = makeSafeIdAttr(cm.column.displayname.value);

      const rowClassName = [`row entity-row-${idSafeDisplayname}`];
      if (!canShow(cm)) {
        rowClassName.push(CLASS_NAMES.HIDDEN);
      }
      if (hideAllHeaders) {
        rowClassName.push('hide-border');
      }
      if (hideHeader) {
        rowClassName.push('hidden-header');
      }

      const entityKeyClassName = ['entity-key col-4 col-sm-4 col-md-3 col-lg-3 col-xl-2'];
      if (hideHeader) {
        entityKeyClassName.push(CLASS_NAMES.HIDDEN);
      }

      const entityValueClassName = ['entity-value'];
      if (hideHeader) {
        entityValueClassName.push('col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12');
      } else {
        entityValueClassName.push('col-8 col-sm-8 col-md-9 col-lg-9 col-xl-10');
      }

      const columnDisplayname = (
        <span className={`column-displayname ${hasTooltip ? 'chaise-icon-for-tooltip' : ''}`}>
          <DisplayValue value={cm.column.displayname}></DisplayValue>
          {/* NOTE the extra space is needed for proper spacing between icon and text */}
          {hasTooltip ? ' ' : ''}
        </span>
      );

      let isFilePreview = cm.column.isAsset && cm.column.filePreview !== null;
      let fileURL, filename;
      if (isFilePreview && page.length > 0 && page.tuples[0].data[cm.column.name]) {
        fileURL = page.tuples[0].data[cm.column.name];
      }
      isFilePreview = isFilePreview && fileURL && fileURL.length > 0;
      if (
        isFilePreview &&
        cm.column.filenameColumn &&
        page.length > 0 &&
        page.tuples[0].data[cm.column.filenameColumn.name]
      ) {
        filename = page.tuples[0].data[cm.column.filenameColumn.name];
      }

      const rowJsx = (
        <tr
          key={`col-${index}`}
          id={`row-${makeSafeIdAttr(cm.column.name)}`}
          className={rowClassName.join(' ')}
        >
          {/* --------- entity key ---------- */}
          <td className={entityKeyClassName.join(' ')}>
            {/* sticky inner div: `position: sticky` on a <td> is unreliable across browsers
                (even with `border-collapse: separate`), so the cell content is wrapped here
                so the column name + icons + collapse button follow the scroll together. */}
            <div className='record-entity-key-inner'>
              {hasTooltip ? (
                <ChaiseTooltip
                  placement='right'
                  tooltip={<DisplayCommentValue comment={cm.column.comment} />}
                >
                  {columnDisplayname}
                </ChaiseTooltip>
              ) : (
                columnDisplayname
              )}
              <div className='entity-key-icons'>
                {showLoader(cm) && (
                  <Spinner animation='border' size='sm' className='table-column-spinner' />
                )}
              </div>
              <EntityKeyShowCollapseSlot />
            </div>
          </td>
          {/* --------- entity value ---------- */}
          <td
            className={entityValueClassName.join(' ')}
            colSpan={hideHeader ? 2 : 1}
            id={`entity-${idSafeDisplayname}`}
          >
            {hasInlineComment && !cm.relatedModel && (
              <div className='inline-comment-row'>
                <div className='inline-tooltip inline-tooltip-sm'>
                  <DisplayCommentValue comment={cm.column.comment} />
                </div>
              </div>
            )}
            {!cm.relatedModel && !hasError && !isFilePreview && (
              <ShowMoreValue>
                <DisplayValue addClass value={recordValues[cm.index]} />
              </ShowMoreValue>
            )}
            {!cm.relatedModel && !hasError && isFilePreview && (
              <FilePreview
                column={cm.column}
                url={fileURL}
                filename={filename}
                value={recordValues[cm.index]}
              />
            )}
            {cm.relatedModel && (
              <span id={`entity-${cm.index}-table`}>
                {!hasError && <RelatedTableActions relatedModel={cm.relatedModel} />}
                <ShowMoreValue>
                  <div
                    className={`inline-table-display ${hasError || !hasInitialized ? CLASS_NAMES.HIDDEN : ''}`}
                  >
                    {hasInlineComment && (
                      <div className='inline-tooltip inline-tooltip-sm'>
                        <DisplayCommentValue comment={cm.column.comment} />
                      </div>
                    )}
                    <RelatedTable
                      relatedModel={cm.relatedModel}
                      displaynameForID={cm.column.displayname.value}
                      showSingleScrollbar={true}
                    />
                  </div>
                </ShowMoreValue>
              </span>
            )}
            {hasError && (
              <ChaiseTooltip placement='bottom' tooltip={MESSAGE_MAP.queryTimeoutTooltip}>
                <span className='fa-solid fa-triangle-exclamation'></span>
              </ChaiseTooltip>
            )}
          </td>
        </tr>
      );

      // every row gets its own provider so the entity-key button and value cell
      // share expand/overflow state — rows that don't overflow render nothing extra.
      return <ShowMoreRowProvider key={`col-${index}`}>{rowJsx}</ShowMoreRowProvider>;
    });
  };

  const hasSpinner = errors.length === 0 && showMainSectionSpinner;
  return (
    <div className={`record-main-section ${hasSpinner ? ' with-spinner' : ''}`}>
      {hasSpinner && (
        <div className='sticky-spinner-outer-container'>
          <ChaiseSpinner className='record-main-spinner manual-position-spinner' />
        </div>
      )}
      <table className='table table-fixed-layout record-main-section-table'>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
