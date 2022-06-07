import '@isrd-isi-edu/chaise/src/assets/scss/_facet-choice-picker.scss';

import Q from 'q';
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useEffect, useState } from 'react';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/recordset-modal';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import CheckList from '@isrd-isi-edu/chaise/src/components/check-list';

type FacetChoicePickerProps = {
  facetColumn: any,
  facetModel: any,
  index: number,
  register: Function
}

const FacetChoicePicker = ({
  facetColumn,
  facetModel,
  index,
  register
}: FacetChoicePickerProps): JSX.Element => {

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);
  const [checkboxRows, setCheckboxRows] = useState<FacetCheckBoxRow[]>([]);
  const [ hasMore, setHasMore ] = useState(false);

  let reference: any, columnName: string;
  if (facetColumn.isEntityMode) {
    reference = facetColumn.sourceReference.contextualize.compactSelect;
    columnName = facetColumn.column.name;
  } else {
    reference = facetColumn.scalarValuesReference;
    // the first column will be the value column
    columnName = reference.columns[0].name;
  }
  if (facetModel.isOpen) {
    $log.debug('got the new reference man!');
  }

  // make sure to add the search term
  // if (searchTerm) {
  //   reference = scope.reference.search(scope.searchTerm);
  // }

  useEffect(() => {
    register(index, updateFacet, preProcessFacet);
  }, []);

  const updateFacet = () => {
    const defer = Q.defer();
    $log.debug(`updating facet ${index}`);

    (function (uri) {
      reference.read(10, {}, true).then((page: any) => {
        // if this is not the result of latest facet change
        if (reference.uri !== uri) {
          defer.resolve(false);
          return defer.promise;
        }

        setHasMore(page.hasNext);

        setCheckboxRows(page.tuples.map((tuple: any, index: number) => {
          return {
            uniqueId: tuple.uniqueId,
            displayname: tuple.displayname,
            selected: false,
            disabled: false
          }
        }));

        defer.resolve(true);
      });
    })(reference.uri);

    return defer.promise;
  };

  const preProcessFacet = () => {
    const defer = Q.defer();
    $log.debug(`preprocessing facet ${index}`);

    setTimeout(() => {
      defer.resolve(true);
    }, 1000);

    return defer.promise;
  }

  const searchCallback = (searchTerm: any, action: any) => {
    $log.log(`search for ${searchTerm} in facet index=${index}`);
  }

  const openRecordsetModal = () => {
    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      showFaceting: false,
      disableFaceting: true,
      displayMode: RecordsetDisplayMode.FACET_POPUP,
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
  };

  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number, event: any) => {
    const checked = !row.selected;
    $log.log(`facet checkbox ${row.uniqueId} has been ${checked ? 'selected' : 'deselected'}`);

    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => curr !== row ? curr : { ...curr, selected: checked });
    });
  };

  return (
    <div className='choice-picker'>
      <div className='picker-container'>
        <SearchInput
          initialSearchTerm={''}
          searchCallback={searchCallback}
          searchColumns={facetColumn.isEntityMode ? facetColumn.sourceReference.searchColumns : null}
          disabled={facetColumn.hasNotNullFilter}
        />
        <CheckList initialized={true} rows={checkboxRows} onRowClick={onRowClick} />
        <button
          id='show-more' className='chaise-btn chaise-btn-sm chaise-btn-tertiary pull-right show-more-btn'
          disabled={facetColumn.hasNotNullFilter}
          onClick={() => openRecordsetModal()}
        >
          <span className='chaise-btn-icon far fa-window-restore'></span>
          {/* <span ng-bind='hasMore || showFindMore ? 'Show More' : 'Show Details''></span> */}
          <span>{hasMore ? 'Show more' : 'Show Details'}</span>
        </button>
        {/* <a id='reset-facet' ng-if='facetModel.noConstraints' class='pull-right' ng-click='::retryQuery(false)' tooltip-placement='bottom' uib-tooltip='Retry updating the facet values with constraints.'><b>Retry</b></a> */}
        {
          recordsetModalProps &&
          <RecordsetModal
            contentClassName={facetColumn.isEntityMode ? 'faceting-show-details-popup' : 'scalar-show-details-popup'}
            recordsetProps={recordsetModalProps}
            onHide={hideRecordsetModal}
          />
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
