import '@isrd-isi-edu/chaise/src/assets/scss/_record-main-section.scss';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import RelatedTableActions from '@isrd-isi-edu/chaise/src/components/record/related-table-actions';
import RelatedTable from '@isrd-isi-edu/chaise/src/components/record/related-table';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { RecordColumnModel } from '@isrd-isi-edu/chaise/src/models/record';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { canShowInlineRelated } from '@isrd-isi-edu/chaise/src/utils/record-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';


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
      const hasTooltip = cm.column.comment && cm.column.commentDisplay === 'tooltip';
      const hasError = showError(cm);
      const hasInitialized = !!cm.relatedModel && cm.relatedModel.tableMarkdownContentInitialized &&
        cm.relatedModel.recordsetState.isInitialized;
      const idSafeDisplayname = makeSafeIdAttr(cm.column.displayname.value);

      const rowClassName = ['row'];
      if (!canShow(cm)) {
        rowClassName.push(CLASS_NAMES.HIDDEN);
      }
      if (hideAllHeaders) {
        rowClassName.push('hide-border')
      }
      if (hideHeader) {
        rowClassName.push('hidden-header');
      }

      const entityKeyClassName = ['entity-key col-xs-4 col-sm-4 col-md-3 col-lg-2'];
      if (hideHeader) {
        entityKeyClassName.push(CLASS_NAMES.HIDDEN)
      }

      const entityValueClassName = ['entity-value'];
      if (hideHeader) {
        entityValueClassName.push('col-xs-12 col-sm-12 col-md-12 col-lg-12');
      } else {
        entityValueClassName.push('col-xs-8 col-sm-8 col-md-9 col-lg-10');
      }

      return (
        // TODO in angularjs this used to be ng-if, but we need the related comp even if we're not showing
        <tr key={`col-${index}`} id={`row-${cm.column.name}`} className={rowClassName.join(' ')}>
          {/* --------- entity key ---------- */}
          <td className={entityKeyClassName.join(' ')}>
            <ConditionalWrapper
              condition={hasTooltip}
              wrapper={children => (
                <ChaiseTooltip placement='right' tooltip={cm.column.comment}>{children}</ChaiseTooltip>
              )}
            >
              <>
                <DisplayValue value={cm.column.displayname}></DisplayValue>
                {hasTooltip && <span className='chaise-icon-for-tooltip align-center-icon'></span>}
                <div className='entity-key-icons'>
                  {showLoader(cm) && <Spinner animation='border' size='sm' className='aggregate-col-loader' />}
                </div>
              </>
            </ConditionalWrapper>
          </td>
          {/* --------- entity value ---------- */}
          <td
            className={entityValueClassName.join(' ')} colSpan={hideHeader ? 2 : 1}
            id={`entity-${idSafeDisplayname}`}
          >
            {!cm.relatedModel && !hasError &&
              <DisplayValue addClass={true} value={recordValues[cm.index]} />
            }
            {cm.relatedModel &&
              <span id={`entity-${cm.index}-table`}>
                {!hasError && <RelatedTableActions relatedModel={cm.relatedModel} />}
                <div className={`inline-table-display ${hasError || !hasInitialized ? CLASS_NAMES.HIDDEN : ''}`}>
                  {cm.column.commentDisplay === 'inline' && cm.column.comment &&
                    <div className='inline-tooltip'>{cm.column.comment}</div>
                  }
                  <RelatedTable
                    relatedModel={cm.relatedModel}
                    tableContainerID={`rt-${idSafeDisplayname}`}
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

  return (
    <div className={`record-display entity-container${errors.length === 0 && showMainSectionSpinner ? ' with-spinner' : ''}`}>
      {errors.length === 0 && showMainSectionSpinner &&
        <div className='record-main-spinner-container'>
          <ChaiseSpinner className='record-main-spinner manual-position-spinner' />
        </div>
      }
      <table className='table table-fixed-layout' id='tblRecord'>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
