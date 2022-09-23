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


/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = (): JSX.Element => {

  const { errors } = useError();
  const { recordValues, columnModels, showEmptySections, showMainSectionSpinner } = useRecord();

  const canShow = (cm: RecordColumnModel) => {
    if (cm.relatedModel) {
      // this flag signals that the returned data is non-empty and is returned
      const nonEmpty = (cm.relatedModel.recordsetState.page && cm.relatedModel.recordsetState.page.length > 0 &&
        cm.relatedModel.tableMarkdownContentInitialized);

      // filter-in-source if the filter is based on the main table and returns empty, the related table should be hidden
      const ref = cm.relatedModel.initialReference;
      if (ref.pseudoColumn && ref.pseudoColumn.isFiltered && ref.pseudoColumn.filterProps.hasRootFilter) {
        return nonEmpty;
      }
      return (showEmptySections || nonEmpty);
    } else if (cm.requireSecondaryRequest) {
      return (showEmptySections || (!!recordValues[cm.index] && !!recordValues[cm.index].value));
    } else {
      return (recordValues[cm.index] && recordValues[cm.index].value != null);
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

  const renderEntityKey = (cm: RecordColumnModel) => {
    const hasTooltip = cm.column.comment && cm.column.commentDisplay === 'tooltip';
    return (
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
    );
  };

  const renderEntityValue = (cm: RecordColumnModel) => {
    const hasError = showError(cm);
    const hasInitialized = !!cm.relatedModel && cm.relatedModel.tableMarkdownContentInitialized &&
      cm.relatedModel.recordsetState.isInitialized;
    return (
      <>
        {!cm.relatedModel && !hasError &&
          <DisplayValue addClass={true} value={recordValues[cm.index]} />
        }
        {cm.relatedModel &&
          <span id={`entity-${cm.index}-table`}>
            {!hasError && <RelatedTableActions relatedModel={cm.relatedModel} />}
            <div className={`${hasError || !hasInitialized ? 'forced-hidden' : ''}`}>
              <RelatedTable relatedModel={cm.relatedModel} />
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
      </>
    )
  }

  return (
    <div className={`record-display entity-container${errors.length === 0 && showMainSectionSpinner ? ' with-spinner' : ''}`}>
      {errors.length === 0 && showMainSectionSpinner &&
        <div className='record-main-spinner-container'>
          <ChaiseSpinner className='record-main-spinner manual-position-spinner' />
        </div>
      }
      <table className='table table-fixed-layout' id='tblRecord'>
        <tbody>
          {columnModels.map((cm: any, index: any) => (
            // TODO in angularjs this used to be ng-if, but we need the related comp even if we're not showing
            <tr key={`col-${index}`} id={`row-${cm.column.name}`} className={`row ${!canShow(cm) ? 'forced-hidden' : ''}`}>
              <td className='entity-key col-xs-4 col-sm-4 col-md-3 col-lg-2'>
                {renderEntityKey(cm)}
              </td>
              <td className='entity-value col-xs-8 col-sm-8 col-md-9 col-lg-10'>
                {renderEntityValue(cm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
