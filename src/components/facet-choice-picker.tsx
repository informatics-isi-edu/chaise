import { LogStackTypes } from '@chaise/models/log';
import { RecordSetConfig, RecordSetDisplayMode, RecordsetSelectMode } from '@chaise/models/recordset';
import { LogService } from '@chaise/services/log';
import $log from '@chaise/services/logger';
import { useState } from 'react';
import { RecordSetProps } from '@chaise/components/recordset';
import RecordsetModal from '@chaise/components/recordset-modal';
import SearchInput from '@chaise/components/search-input';

type FacetChoicePickerProps = {
  facetColumn: any,
  index: number
}

const FacetChoicePicker = ({
  facetColumn,
  index
}: FacetChoicePickerProps): JSX.Element => {
  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordSetProps|null>(null);

  const searchCallback = (searchTerm: any, action: any) => {
    $log.log(`search for ${searchTerm} in facet index=${index}`);
  }

  const openRecordsetModal = () => {
    const recordsetConfig : RecordSetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      showFaceting: false,
      disableFaceting: true,
      displayMode: RecordSetDisplayMode.FACET_POPUP,
      // TODO
      // enableFavorites
    };

    let reference;
    if (facetColumn.isEntityMode) {
        reference = facetColumn.sourceReference.contextualize.compactSelect;
    } else {
        reference = facetColumn.scalarValuesReference;
    }

    // TODO log object should be cached and be proper!
    const logInfo = {
      logObject: null,
      logStack: [
        LogService.getStackNode(
          LogStackTypes.SET,
          reference.table,
          reference.filterLogInfo,
        ),
      ],
      logStackPath: LogStackTypes.SET,
    };

    setRecordsetModalProps({
      initialReference: reference,
      initialPageLimit: 25,
      config: recordsetConfig,
      logInfo,
    });
  };

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  }

  return (
    <div className='choice-picker'>
      <div className='picker-container'>
        <SearchInput
          initialSearchTerm={''}
          searchCallback={searchCallback}
          searchColumns={facetColumn.isEntityMode ? facetColumn.sourceReference.searchColumns : null}
          disabled={facetColumn.hasNotNullFilter}
        />
        <div>
          List goes here
        </div>
        <button
          id='show-more' className='chaise-btn chaise-btn-sm chaise-btn-tertiary pull-right show-more-btn'
          disabled={facetColumn.hasNotNullFilter}
          onClick={() => openRecordsetModal()}
        >
          <span className='chaise-btn-icon far fa-window-restore'></span>
          {/* <span ng-bind='hasMore || showFindMore ? 'Show More' : 'Show Details''></span> */}
          <span>Show more</span>
        </button>
        {/* <a id='reset-facet' ng-if='facetModel.noConstraints' class='pull-right' ng-click='::retryQuery(false)' tooltip-placement='bottom' uib-tooltip='Retry updating the facet values with constraints.'><b>Retry</b></a> */}
        {
          recordsetModalProps &&
          <RecordsetModal
            contentClassName={facetColumn.isEntityMode ? 'faceting-show-details-popup' : 'scalar-show-details-popup'}
            recordsetProps={recordsetModalProps}
            onHide={hideRecordsetModal}
          ></RecordsetModal>
        }
      </div>
      {/* <div ng-show='facetModel.facetError'>
        <p>Request timeout: The facet values cannot be retrieved. Try the following to reduce the query time:
          <ul class='show-list-style'>
            <li>Reduce the number of facet constraints.</li>
            <li>Minimize the use of 'No value' and 'All records with value' filters.</li>
          </ul>
          Click Simplify to retrieve facet values without constraints.
        </p>
        <button id='retry-query-btn' class='chaise-btn chaise-btn-primary' ng-click='::retryQuery(false)' tooltip-placement='bottom-left' uib-tooltip='Retry updating the facet values with constraints.'>Retry</button>
        <button id='remove-constraints-btn' class='chaise-btn chaise-btn-primary' ng-click='::retryQuery(true)' tooltip-placement='bottom-left' uib-tooltip='Provide facet values without any constraints applied.'>Simplify</button>
      </div> */}
    </div>
  )
}

export default FacetChoicePicker;
