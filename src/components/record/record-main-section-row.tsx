// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import ShowCollapseRail from '@isrd-isi-edu/chaise/src/components/record/show-collapse-rail';
import RecordShowMoreValue from '@isrd-isi-edu/chaise/src/components/record/record-show-more-value';
import Spinner from 'react-bootstrap/Spinner';
import FilePreview from '@isrd-isi-edu/chaise/src/components/file-preview';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';

// models
import { RecordColumnModel } from '@isrd-isi-edu/chaise/src/models/record';
import { CommentDisplayModes } from '@isrd-isi-edu/chaise/src/models/displayname';

// providers
import { ShowMoreRowProvider } from '@isrd-isi-edu/chaise/src/providers/record-show-more';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { canShowInlineRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

import type { JSX } from 'react';

type RecordMainSectionRowProps = {
  /**
   * the column model that this row is displaying
   */
  columnModel: RecordColumnModel;
};

/**
 * One row of the record main section: the entity-key cell (column name and,
 * when applicable, the show/collapse rail) and the entity-value cell.
 *
 * When the column has a valid `visible_cell_height`, the row is wrapped in
 * `ShowMoreRowProvider` so the rail and the value share expand/overflow state.
 */
const RecordMainSectionRow = ({ columnModel: cm }: RecordMainSectionRowProps): JSX.Element => {
  const { reference, recordValues, showEmptySections, page } = useRecord();

  const canShow = (): boolean => {
    // condition evaluated to hide, so should be hidden
    if (cm.conditionHide) return false;

    if (cm.relatedModel) {
      return canShowInlineRelated(cm, showEmptySections);
    } else if (cm.requireSecondaryRequest) {
      return showEmptySections || (!!recordValues[cm.index] && !!recordValues[cm.index].value);
    } else {
      return recordValues[cm.index] && recordValues[cm.index].value !== null;
    }
  };

  /**
   * Show an error warning if the column is aggregate or inline related table and the data failed to load
   */
  const showError = (): boolean => {
    if (cm.hasTimeoutError) return true;
    // disable !== checking since cm.relatedModel can be `null` OR `undefined`
    // eslint-disable-next-line eqeqeq
    return cm.relatedModel != null && cm.relatedModel.recordsetState.hasTimeoutError;
  };

  const showLoader = (): boolean => {
    // TODO this is assuming isLoading is also used for the inlines (page.content)
    // disable !== checking since cm.relatedModel can be `null` OR `undefined`
    // eslint-disable-next-line eqeqeq
    return cm.isLoading || (cm.relatedModel != null && cm.relatedModel.recordsetState.isLoading);
  };

  const hideAllHeaders = reference.display.hideColumnHeaders;
  const hideHeader = hideAllHeaders || cm.column.hideColumnHeader;
  const hasTooltip =
    !!cm.column.comment &&
    !!cm.column.comment.value &&
    cm.column.comment.displayMode === CommentDisplayModes.TOOLTIP;
  const hasInlineComment =
    !!cm.column.comment &&
    !!cm.column.comment.value &&
    cm.column.comment.displayMode === CommentDisplayModes.INLINE;
  const hasError = showError();
  const hasInitialized =
    !!cm.relatedModel &&
    cm.relatedModel.tableMarkdownContentInitialized &&
    cm.relatedModel.recordsetState.isInitialized;
  const idSafeDisplayname = makeSafeIdAttr(cm.column.displayname.value);

  // ermrestjs guarantees visibleCellHeight is a positive number or `false`
  const maxHeight =
    typeof cm.column.display?.visibleCellHeight === 'number'
      ? cm.column.display.visibleCellHeight
      : null;
  const hasShowMore = maxHeight !== null && maxHeight > 0;

  const rowClassName = [`row entity-row-${idSafeDisplayname}`];
  if (!canShow()) {
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

  // values are wrapped with show-more clipping only when the annotation is set
  const wrapValue = (content: JSX.Element) => {
    return hasShowMore ? <RecordShowMoreValue>{content}</RecordShowMoreValue> : content;
  };

  const renderedRow = (
    <tr id={`row-${makeSafeIdAttr(cm.column.name)}`} className={rowClassName.join(' ')}>
      {/* --------- entity key ---------- */}
      <td className={entityKeyClassName.join(' ')}>
        {/* sticky inner div: `position: sticky` on a <td> is unreliable across browsers
            (even with `border-collapse: separate`), so the column name + icons are
            wrapped here so they follow the scroll together. The collapse rail is a
            sibling so it can span the full cell height (sticky inner moves; rail doesn't). */}
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
            {showLoader() && (
              <Spinner animation='border' size='sm' className='table-column-spinner' />
            )}
          </div>
        </div>
        {hasShowMore && <ShowCollapseRail />}
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
        {/* file preview */}
        {isFilePreview && !cm.relatedModel && !hasError && (
          <FilePreview
            column={cm.column}
            url={fileURL}
            filename={filename}
            value={recordValues[cm.index]}
          />
        )}
        {/* inline value */}
        {!cm.relatedModel &&
          !hasError &&
          !isFilePreview &&
          wrapValue(<DisplayValue addClass value={recordValues[cm.index]} />)}
        {/* related table */}
        {cm.relatedModel && (
          <span id={`entity-${cm.index}-table`}>
            {!hasError && <RelatedTableActions relatedModel={cm.relatedModel} />}
            {wrapValue(
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
            )}
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

  if (!hasShowMore) return renderedRow;
  return <ShowMoreRowProvider maxHeight={maxHeight}>{renderedRow}</ShowMoreRowProvider>;
};

export default RecordMainSectionRow;
