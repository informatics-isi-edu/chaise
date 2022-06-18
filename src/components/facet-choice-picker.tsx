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
import FacetCheckList from '@isrd-isi-edu/chaise/src/components/facet-check-list';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/facet-utils';
import { useIsFirstRender } from '@isrd-isi-edu/chaise/src/hooks/is-first-render';
import { FACET_PANEL_DEFAULT_PAGE_SIZE, RECORDSET_DEAFULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';

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
  facetIndex: number,
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
  dispatchFacetUpdate: Function,
  /**
   * Allows checking of the reference url and will display an alert if needed
   */
  checkReferenceURL: Function,
  /**
   * dispatch the update of reference
   */
  updateRecordsetReference: Function
}

const FacetChoicePicker = ({
  facetColumn,
  facetModel,
  facetIndex,
  register,
  facetPanelOpen,
  dispatchFacetUpdate,
  checkReferenceURL,
  updateRecordsetReference
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

  // populate facetReference and columnName that are used throughout the component
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

  // remove the constraints if scope.facetModel.noConstraints
  if (facetModel.noConstraints) {
    facetReference = facetReference.unfilteredReference;
    if (facetColumn.isEntityMode) {
      facetReference = facetReference.contextualize.compactSelect;
    }
  }

  /**
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    callRegister();
  }, [facetModel, checkboxRows]);

  // when searchTerm changed, ask flow-control to update it
  useEffect(() => {
    if (isFirstRender) return;
    // make sure the callbacks with latest scope are used
    callRegister();

    // TODO
    // log the client action
    // var extraInfo = typeof term === "string" ? {"search-str": term} : {};
    // logService.logClientAction({
    //     action: scope.parentCtrl.getFacetLogAction(scope.index, action),
    //     stack: scope.parentCtrl.getFacetLogStack(scope.index, extraInfo)
    // }, scope.facetColumn.sourceReference.defaultLogInfo);

    $log.debug(`faceting: request for facet (index=${facetIndex} update. new search=${searchTerm}`);

    // ask the parent to update the facet column
    dispatchFacetUpdate(facetIndex, true, LogReloadCauses.FACET_SEARCH_BOX);

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
  const callRegister = () => {
    register(facetIndex, processFacet, preProcessFacet, getAppliedFilters);
  };

  const preProcessFacet = () => {
    const defer = Q.defer();

    // if not_null exist, other filters are not relevant
    if (facetColumn.hasNotNullFilter) {
      // facetModel.appliedFilters.push(facetingUtils.getNotNullFilter(true));
      setCheckboxRows([getNotNullFacetCheckBoxRow(true)]);

      defer.resolve();
    }
    else if (facetColumn.choiceFilters.length === 0) {
      defer.resolve();
    }
    else {
      const res: FacetCheckBoxRow[] = [];

      // getChoiceDisplaynames won't return the null filter, so we need to check for it first
      if (facetColumn.hasNullFilter) {
        // scope.facetModel.appliedFilters.push(facetingUtils.getNullFilter(true));
        res.push(getNullFacetCheckBoxRow(true));
      }

      // TODO
      const facetLog = {};
      // const facetLog = getDefaultLogInfo(scope);
      // facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, logService.logActions.PRESELECTED_FACETS_LOAD);
      facetColumn.getChoiceDisplaynames(facetLog).then(function (filters: any) {
        filters.forEach(function (f: any) {
          // scope.facetModel.appliedFilters.push({
          //   uniqueId: f.uniqueId,
          //   displayname: f.displayname,
          //   tuple: f.tuple // the returned tuple might be null (in case of scalar)
          // });
          res.push({
            uniqueId: f.uniqueId,
            displayname: f.displayname,
            tuple: f.tuple, // the returned tuple might be null (in case of scalar)
            selected: true
          });
        });

        setCheckboxRows(res);

        defer.resolve();
      }).catch(function (error: any) {
        defer.reject(error);
      });
    }

    return defer.promise;
  }

  const processFacet = () => {
    const defer = Q.defer();

    $log.debug(facetReference.uri);

    // we will set the checkboxRows to the value of this variable at the end
    const updatedRows: FacetCheckBoxRow[] = [];

    // add not-null filter if it should be added and already has not been selected
    if (!facetColumn.hideNotNullChoice && !facetColumn.hasNotNullFilter) {
      updatedRows.push(getNotNullFacetCheckBoxRow());
    }

    // add null filter if it should be added and already has not been selected
    if (!facetColumn.hideNullChoice && !facetColumn.hasNullFilter) {
      updatedRows.push(getNullFacetCheckBoxRow(facetColumn.hasNullFilter));
    }

    // add the already selected facets
    updatedRows.push(...getAppliedFilters());

    // maxCheckboxLen: Maximum number of checkboxes that we could show
    // (PAGE_SIZE + if not-null is allowed + if null is allowed)
    let maxCheckboxLen = FACET_PANEL_DEFAULT_PAGE_SIZE;
    if (!facetColumn.hideNotNullChoice) maxCheckboxLen++;
    if (!facetColumn.hideNullChoice) maxCheckboxLen++;

    // appliedLen: number of applied filters (apart from null and not-null)
    //if this is more than PAGE_SIZE, we don't need to read the data.
    let appliedLen = updatedRows.length;
    if (facetColumn.hasNullFilter) appliedLen--;
    if (facetColumn.hasNotNullFilter) appliedLen--;

    // there are more than PAGE_SIZE selected rows, just display them.
    if (appliedLen >= FACET_PANEL_DEFAULT_PAGE_SIZE) {
      // there might be more, we're not sure
      processFavorites(updatedRows).then(function (res) {

        setHasMore(true);
        setCheckboxRows(updatedRows);

        defer.resolve(res);
      }).catch(function (err) {
        defer.reject(err);
      });
      return defer.promise;
    }

    (function (uri) {
      // TODO log stuff
      // the reload causes and stuff should be handled by the parent not here
      const facetLog = {};
      // var facetLog = getDefaultLogInfo(scope);

      // // create the action
      // var action = logService.logActions.FACET_CHOICE_LOAD;
      // if (scope.facetModel.reloadCauses.length > 0) {
      //     action = logService.logActions.FACET_CHOICE_RELOAD;
      //     // add causes
      //     facetLog.stack = logService.addCausesToStack(facetLog.stack, scope.facetModel.reloadCauses, scope.facetModel.reloadStartTime);
      // }
      // facetLog.action = scope.parentCtrl.getFacetLogAction(scope.index, action);

      // // update the filter log info to stack
      // logService.updateStackFilterInfo(facetLog.stack, scope.reference.filterLogInfo);


      facetReference.read(FACET_PANEL_DEFAULT_PAGE_SIZE, facetLog, true).then((page: any) => {
        // if this is not the result of latest facet change
        if (facetReference.uri !== uri) {
          defer.resolve(false);
          return defer.promise;
        }

        // TODO handle by the parent
        // scope.facetModel.reloadCauses = [];
        // scope.facetModel.reloadStartTime = -1;

        // TODO could be merged with checkBoxRows
        setHasMore(page.hasNext);

        page.tuples.forEach(function (tuple: any) {
          // if we're showing enough rows
          if (updatedRows.length === maxCheckboxLen) {
            return;
          }

          // filter and tuple uniqueId might be different
          const value = getFilterUniqueId(tuple, columnName);

          const i = updatedRows.findIndex(function (row) {
            return row.uniqueId === value && !row.isNotNull;
          });

          // it's already selected
          if (i !== -1) {
            return;
          }

          updatedRows.push({
            selected: false,
            uniqueId: value,
            displayname: tuple.displayname,
            tuple: tuple
          });
        });

        return processFavorites(updatedRows);
      }).then((result: any) => {

        setCheckboxRows(updatedRows);

        defer.resolve(result);
      }).catch(function (err: any) {
        defer.reject(err);
      });
    })(facetReference.uri);

    return defer.promise;
  };

  const getAppliedFilters = () => {
    return checkboxRows.filter((cbr: FacetCheckBoxRow) => cbr.selected);
  };

  /**
   * Given tuple and the columnName that should be used, return
   * the filter's uniqueId (in case of entityPicker, it might be different from the tuple's uniqueId)
   * @param  {Object} tuple      the tuple object
   * @param  {string} columnName name of column (in scalar it is 'value')
   * @return {string}            filter's uniqueId
   */
  const getFilterUniqueId = (tuple: any, columnName: string) => {
    if (tuple.data && columnName in tuple.data) {
      return tuple.data[columnName];
    }
    return tuple.uniqueId;
  }

  const processFavorites = (rows: any) => {
    const defer = Q.defer();
    // TODO favorites
    defer.resolve(true);

    return defer.promise;
  };

  //-------------------  UI related callbacks:   --------------------//
  const searchCallback = (term: string | null, action: LogActions) => {
    if (term) term = term.trim();

    // make sure adding the search doesn't go above the URL length limit
    const ref = facetReference.search(term);
    if (checkReferenceURL(ref)) {
      setSearchTerm(term);
    }
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
      initialPageLimit: RECORDSET_DEAFULT_PAGE_SIZE,
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

    const cause = checked ? LogReloadCauses.FACET_SELECT : LogReloadCauses.FACET_DESELECT;
    // get the new reference based on the operation
    let ref;
    if (row.isNotNull) {
      if (checked) {
        ref = facetColumn.addNotNullFilter();
      } else {
        ref = facetColumn.removeNotNullFilter();
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) choice add. Not null filter.`);
    } else {
      if (checked) {
        ref = facetColumn.addChoiceFilters([row.uniqueId]);
      } else {
        ref = facetColumn.removeChoiceFilters([row.uniqueId]);
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) choice ${row.selected ? 'add' : 'remove'}. uniqueId='${row.uniqueId}`);
    }

    // this function checks the URL length as well and might fails
    if (!updateRecordsetReference(ref, facetIndex, cause)) {
      $log.debug('faceting: URL limit reached. Reverting the change.');
      event.preventDefault();
      return;
    }

    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => curr !== row ? curr : { ...curr, selected: checked });
    });
  };

  const retryQuery = (noConstraints: boolean) => {
    // TODO
    $log.debug(`retrying facet ${facetIndex}`);
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
          <FacetCheckList
            initialized={facetModel.isOpen && facetModel.initialized && facetPanelOpen}
            rows={checkboxRows} hasNotNullFilter={facetColumn.hasNotNullFilter}
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
