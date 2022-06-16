import '@isrd-isi-edu/chaise/src/assets/scss/_facet-choice-picker.scss';

import Q from 'q';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { LogActions, LogReloadCauses, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow, FacetModel, RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/recordset-modal';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import CheckList from '@isrd-isi-edu/chaise/src/components/check-list';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/facet-utils';
import { useIsFirstRender } from '@isrd-isi-edu/chaise/src/hooks/is-first-render';

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
  facetPanelOpen: boolean,
  /**
   * ask flow-control to update the data
   */
  dispatchFacetUpdate: Function
}

const FacetChoicePicker = ({
  facetColumn,
  facetModel,
  index,
  register,
  facetPanelOpen,
  dispatchFacetUpdate,
}: FacetChoicePickerProps): JSX.Element => {

  const isFirstRender = useIsFirstRender();

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);
  const [checkboxRows, setCheckboxRows] = useState<FacetCheckBoxRow[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  /**
   * Whether we should display "show more" if some items are hidden because of height
   */
  const [showFindMore, setShowFindMore] = useState(false);

  const choicePickerContainer = useRef<HTMLDivElement>(null);
  const listContainer = useRef<HTMLDivElement>(null);

  let facetReference: any, columnName: string;
  if (facetColumn.isEntityMode) {
    facetReference = facetColumn.sourceReference.contextualize.compactSelect;
    columnName = facetColumn.column.name;
  } else {
    facetReference = facetColumn.scalarValuesReference;
    // the first column will be the value column
    columnName = facetReference.columns[0].name;
  }

  // make sure to add the search term
  if (searchTerm) {
    facetReference = facetReference.search(searchTerm);
  }

  /**
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    register(index, processFacet, preProcessFacet);
  }, [facetModel]);

  // when searchTerm changed, ask flow-control to update it
  useEffect(() => {
    if (isFirstRender) return;
    // make sure the callbacks with latest scope are used
    register(index, processFacet, preProcessFacet);

    // TODO
    // log the client action
    // var extraInfo = typeof term === "string" ? {"search-str": term} : {};
    // logService.logClientAction({
    //     action: scope.parentCtrl.getFacetLogAction(scope.index, action),
    //     stack: scope.parentCtrl.getFacetLogStack(scope.index, extraInfo)
    // }, scope.facetColumn.sourceReference.defaultLogInfo);

    $log.debug(`faceting: request for facet (index=${index} update. new search=${searchTerm}`);

    // ask the parent to update the facet column
    dispatchFacetUpdate(index, true, LogReloadCauses.FACET_SEARCH_BOX);

  }, [searchTerm]);

  /**
   * we're setting the height of ChecList in check-list to avoid jumping of UI
   * if because of this logic some options are hidden, we should make sure
   * we're indicating that in the UI.
   */
  useLayoutEffect(() => {
    if (!listContainer.current) return;
    if (facetModel.isOpen && !facetModel.isLoading) {
      setShowFindMore(listContainer.current.scrollHeight > listContainer.current.offsetHeight);
    }
  }, [facetModel.isOpen, facetModel.isLoading]);

  //-------------------  flow-control related functions:   --------------------//
  const processFacet = () => {
    const defer = Q.defer();
    $log.debug(`updating facet ${index}`);
    $log.debug(`facet model is ${facetModel.isOpen}, ${facetModel.isLoading}`);

    $log.debug(facetReference.uri);

    const updatedRows: FacetCheckBoxRow[] = [];

    // show not-null if it exists or hide_not_null_choice is missing.
    if (!facetColumn.hideNotNullChoice) {
      updatedRows.push(getNotNullFacetCheckBoxRow(facetColumn.hasNotNullFilter));
    }

    if (!facetColumn.hideNullChoice) {
      updatedRows.push(getNullFacetCheckBoxRow(facetColumn.hasNullFilter, facetColumn.hasNotNullFilter));
    }

    (function (uri) {
      facetReference.read(8, {}, true).then((page: any) => {
        // if this is not the result of latest facet change
        if (facetReference.uri !== uri) {
          defer.resolve(false);
          return defer.promise;
        }

        setHasMore(page.hasNext);

        updatedRows.push(...page.tuples.map((tuple: any, index: number) => {
          return {
            uniqueId: tuple.uniqueId,
            displayname: tuple.displayname,
            selected: false,
            disabled: facetColumn.hasNotNullFilter
          }
        }));

        setCheckboxRows(updatedRows);

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

  const searchCallback = (term: string | null, action: LogActions) => {
    if (term) term = term.trim();
    // const ref = facetReference.search(term);
    // TODO
    // if (scope.$root.checkReferenceURL(ref)) {
    // scope.searchTerm = term;
    setSearchTerm(term);
    // }
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
          // NOTE the initial search term is always empty
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
