import '@isrd-isi-edu/chaise/src/assets/scss/_facet-choice-picker.scss';

import Q from 'q';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow, FacetModel, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  register: Function,
  /**
   * Whether the facet panel is open or not
   */
  facetPanelOpen: boolean
}

const FacetChoicePicker = ({
  facetColumn,
  facetModel,
  index,
  register,
  facetPanelOpen
}: FacetChoicePickerProps): JSX.Element => {

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);
  const [checkboxRows, setCheckboxRows] = useState<FacetCheckBoxRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [showFindMore, setShowFindMore] = useState(false);

  const choicePickerContainer = useRef<any>(null);
  const listContainer = useRef<any>(null);

  let facetReference: any, columnName: string;
  if (facetColumn.isEntityMode) {
    facetReference = facetColumn.sourceReference.contextualize.compactSelect;
    columnName = facetColumn.column.name;
  } else {
    facetReference = facetColumn.scalarValuesReference;
    // the first column will be the value column
    columnName = facetReference.columns[0].name;
  }

  /**
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    register(index, updateFacet, preProcessFacet);
  }, [facetModel]);

  /**
   * we're setting the height of ChecList in check-list to avoid jumping of UI
   * if because of this logic some options are hidden, we should make sure
   * we're indicating that in the UI.
   */
  useLayoutEffect(() => {
    if (facetModel.isOpen && !facetModel.isLoading) {
      setShowFindMore(listContainer.current.scrollHeight > listContainer.current.offsetHeight);
    }
  }, [facetModel.isOpen, facetModel.isLoading]);

  //-------------------  flow-control related functions:   --------------------//
  const updateFacet = () => {
    const defer = Q.defer();
    $log.debug(`updating facet ${index}`);
    $log.debug(`facet model is ${facetModel.isOpen}, ${facetModel.isLoading}`);

    $log.debug(facetReference.uri);

    (function (uri) {
      facetReference.read(10, {}, true).then((page: any) => {
        // if this is not the result of latest facet change
        if (facetReference.uri !== uri) {
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
    })(facetReference.uri);

    return defer.promise;
  }

  const preProcessFacet = () => {
    const defer = Q.defer();
    $log.debug(`preprocessing facet ${index}`);

    setTimeout(() => {
      defer.resolve(true);
    }, 1000);

    return defer.promise;
  }

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

    // TODO log object should be cached and be proper!
    const logInfo = {
      logObject: null,
      logStack: [
        LogService.getStackNode(
          LogStackTypes.SET,
          facetReference.table,
          facetReference.filterLogInfo,
        ),
      ],
      logStackPath: LogStackTypes.SET,
    };

    setRecordsetModalProps({
      initialReference: facetReference,
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
        <div ref={listContainer}>
          <CheckList
            initialized={facetModel.isOpen && facetModel.initialized && facetPanelOpen}
            rows={checkboxRows}
            onRowClick={onRowClick}
          />
        </div>
        <div className='button-container'>
          <button
            id='show-more' className='chaise-btn chaise-btn-sm chaise-btn-tertiary show-more-btn'
            disabled={facetColumn.hasNotNullFilter}
            onClick={() => openRecordsetModal()}
          >
            <span className='chaise-btn-icon far fa-window-restore'></span>
            <span>{(hasMore || showFindMore) ? 'Show More' : 'Show Details'}</span>
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
    <div className='choice-picker' ref={choicePickerContainer}>
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
