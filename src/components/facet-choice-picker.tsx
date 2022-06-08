import '@isrd-isi-edu/chaise/src/assets/scss/_facet-choice-picker.scss';

import Q from 'q';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow, FacetModel, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useEffect, useState } from 'react';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/recordset-modal';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import CheckList from '@isrd-isi-edu/chaise/src/components/check-list';

type FacetChoicePickerProps = {
  /**
   * The facet column
   */
  facetColumn: any,
  /**
   * The facet model that has the UI state variables
   */
  facetModel: FacetModel,
  /**
   * The index of facet in the list of facetColumns
   */
  index: number,
  /**
   * Allows registering flow-control related function in the faceting component
   */
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
  const [hasMore, setHasMore] = useState(false);

  /**
   * register the flow-control related functions for the facet
   */
  useEffect(() => {
    register(index, updateFacet, preProcessFacet);
  }, []);

  //-------------------  flow-control related functions:   --------------------//

  const updateFacet = () => {
    const defer = Q.defer();
    $log.debug(`updating facet ${index}`);

    let reference: any, columnName: string;
    if (facetColumn.isEntityMode) {
      reference = facetColumn.sourceReference.contextualize.compactSelect;
      columnName = facetColumn.column.name;
    } else {
      reference = facetColumn.scalarValuesReference;
      // the first column will be the value column
      columnName = reference.columns[0].name;
    }

    $log.debug(reference.uri);

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
  };

  //-------------------  UI related callbacks:   --------------------//

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

  const retryQuery = (noConstraints: boolean) => {
    // TODO
    $log.debug(`retrying facet ${index}`);
  }

  //-------------------  render logic:   --------------------//

  const renderPickerContainer = () => {
    return (
      <div className='picker-container'>
        <SearchInput
          initialSearchTerm={''}
          searchCallback={searchCallback}
          searchColumns={facetColumn.isEntityMode ? facetColumn.sourceReference.searchColumns : null}
          disabled={facetColumn.hasNotNullFilter}
        />
        <CheckList
          initialized={facetModel.isOpen && facetModel.initialized}
          rows={checkboxRows}
          onRowClick={onRowClick}
        />
        <div className='button-container'>
          <button
            id='show-more' className='chaise-btn chaise-btn-sm chaise-btn-tertiary show-more-btn'
            disabled={facetColumn.hasNotNullFilter}
            onClick={() => openRecordsetModal()}
          >
            <span className='chaise-btn-icon far fa-window-restore'></span>
            {/* TODO should also take care of the available height like `showFindMore` */}
            <span>{hasMore ? 'Show more' : 'Show Details'}</span>
          </button>
          {facetModel.noConstraints &&
            <OverlayTrigger
              placement='bottom-start'
              overlay={<Tooltip>Retry updating the facet values with constraints.</Tooltip>}
            >
              <button className='chaise-btn chaise-btn-sm chaise-btn-tertiary retry-btn' onClick={() => retryQuery(false)}>
                Retry
              </button>
            </OverlayTrigger>
          }
        </div>
      </div>
    )
  };

  const renderErrorContainer = () => {
    return (
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
    )
  }

  return (
    <div className='choice-picker'>
      {!facetModel.facetError && renderPickerContainer()}
      {facetModel.facetError && renderErrorContainer()}
      {
        recordsetModalProps &&
        <RecordsetModal
          contentClassName={facetColumn.isEntityMode ? 'faceting-show-details-popup' : 'scalar-show-details-popup'}
          recordsetProps={recordsetModalProps}
          onHide={hideRecordsetModal}
        />
      }
    </div>
  )
}

export default FacetChoicePicker;
