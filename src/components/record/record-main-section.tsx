import '@isrd-isi-edu/chaise/src/assets/scss/_record-main-section.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import DisplayCommentValue from '@isrd-isi-edu/chaise/src/components/display-comment-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Spinner from 'react-bootstrap/Spinner';

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
import { useRef } from 'react';

/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = (): JSX.Element => {
  const { errors } = useError();
  const { reference, recordValues, columnModels, showMainSectionSpinner, showEmptySections } = useRecord();

  const canShow = (columnModel: RecordColumnModel): boolean => {
    if (columnModel.relatedModel) {
      return canShowInlineRelated(columnModel, showEmptySections);
    } else if (columnModel.requireSecondaryRequest) {
      return (showEmptySections || (!!recordValues[columnModel.index] && !!recordValues[columnModel.index].value));
    } else {
      return (recordValues[columnModel.index] && recordValues[columnModel.index].value != null);
    }
  };

  /**
   * Show an error warning if the column is aggregate or inline related table and the data failed to load
   */
  const showError = (cm: RecordColumnModel): boolean => {
    return cm.hasTimeoutError || (cm.relatedModel != null && cm.relatedModel.recordsetState.hasTimeoutError);
  };

  const showLoader = (cm: RecordColumnModel): boolean => {
    // TODO this is assuming isLoading is also used for the inlines (page.content)
    return cm.isLoading || (cm.relatedModel != null && cm.relatedModel.recordsetState.isLoading);
  };

  const renderRows = () => {
    const hideAllHeaders = reference.display.hideColumnHeaders;
    return columnModels.map((cm: RecordColumnModel, index: number) => {
      const hideHeader = hideAllHeaders || cm.column.hideColumnHeader;
      const hasTooltip = !!cm.column.comment && cm.column.comment.displayMode === CommentDisplayModes.TOOLTIP;
      const hasError = showError(cm);
      const hasInitialized = !!cm.relatedModel && cm.relatedModel.tableMarkdownContentInitialized &&
        cm.relatedModel.recordsetState.isInitialized;
      const idSafeDisplayname = makeSafeIdAttr(cm.column.displayname.value);

      const rowClassName = [`row entity-row-${idSafeDisplayname}`];
      if (!canShow(cm)) {
        rowClassName.push(CLASS_NAMES.HIDDEN);
      }
      if (hideAllHeaders) {
        rowClassName.push('hide-border')
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

      return (
        <tr key={`col-${index}`} id={`row-${cm.column.name}`} className={rowClassName.join(' ')}>
          {/* --------- entity key ---------- */}
          <td className={entityKeyClassName.join(' ')}>
            {hasTooltip ?
              <ChaiseTooltip placement='right' tooltip={<DisplayCommentValue comment={cm.column.comment} />}>
                {columnDisplayname}
              </ChaiseTooltip> : columnDisplayname
            }
            <div className='entity-key-icons'>
              {showLoader(cm) && <Spinner animation='border' size='sm' className='table-column-spinner' />}
            </div>
          </td>
          {/* --------- entity value ---------- */}
          <td
            className={entityValueClassName.join(' ')} colSpan={hideHeader ? 2 : 1}
            id={`entity-${idSafeDisplayname}`}
          >
            {!cm.relatedModel && !hasError &&
              <DisplayValue addClass value={recordValues[cm.index]} />
            }
            {cm.relatedModel &&
              <span id={`entity-${cm.index}-table`}>
                {!hasError && <RelatedTableActions relatedModel={cm.relatedModel} />}
                <div className={`inline-table-display ${hasError || !hasInitialized ? CLASS_NAMES.HIDDEN : ''}`}>
                  {cm.column.comment && cm.column.comment.displayMode === CommentDisplayModes.INLINE &&
                    <div className='inline-tooltip inline-tooltip-sm'><DisplayCommentValue comment={cm.column.comment} /></div>
                  }
                  <RelatedTable
                    relatedModel={cm.relatedModel}
                    displaynameForID={cm.column.displayname.value}
                  />
                </div>
              </span>
            }
            {hasError &&
              <ChaiseTooltip
                placement='bottom'
                tooltip={MESSAGE_MAP.queryTimeoutTooltip}
              >
                <span className='fa-solid fa-triangle-exclamation'></span>
              </ChaiseTooltip>
            }
          </td>
        </tr>
      );
    });
  };

  const hasSpinner = errors.length === 0 && showMainSectionSpinner;
  return (
    <div className={`record-main-section ${hasSpinner ? ' with-spinner' : ''}`}>
      {hasSpinner &&
        <div className='sticky-spinner-outer-container'>
          <ChaiseSpinner className='record-main-spinner manual-position-spinner' />
        </div>
      }
      <table className='table table-fixed-layout record-main-section-table'>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
