import '@isrd-isi-edu/chaise/src/assets/scss/_facet-choice-picker.scss';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import FacetCheckList from '@isrd-isi-edu/chaise/src/components/faceting/facet-check-list';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import SearchInput from '@isrd-isi-edu/chaise/src/components/search-input';
import { TitleProps } from '@isrd-isi-edu/chaise/src/components/title';

// hooks
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import useIsFirstRender from '@isrd-isi-edu/chaise/src/hooks/is-first-render';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useVarRef from '@isrd-isi-edu/chaise/src/hooks/var-ref';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { LogActions, LogReloadCauses, LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';
import {
  FacetCheckBoxRow, FacetModel, RecordsetConfig, RecordsetDisplayMode,
  RecordsetSelectMode, SelectedRow, RecordsetProps
} from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import { FACET_PANEL_DEFAULT_PAGE_SIZE, RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';


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
  dispatchFacetUpdate: (index: number, setIsLoading: boolean, cause?: string, noConstraints?: boolean) => void,
  /**
   * Allows checking of the reference url and will display an alert if needed
   */
  checkReferenceURL: Function,
  /**
   * dispatch the update of reference
   */
  updateRecordsetReference: Function,
  /**
   * get the facet log action
   */
  getFacetLogAction: (index: number, actionPath: LogActions) => string,
  /**
   * get the facet log stack object
   */
  getFacetLogStack: (index: number, extraInfo?: any) => any,

  recordsetUIContextTitles?: TitleProps[],

  recordsetFacetDepthLevel: number
}

const FacetChoicePicker = ({
  facetColumn,
  facetModel,
  facetIndex,
  register,
  facetPanelOpen,
  dispatchFacetUpdate,
  checkReferenceURL,
  updateRecordsetReference,
  getFacetLogAction,
  getFacetLogStack,
  recordsetUIContextTitles,
  recordsetFacetDepthLevel
}: FacetChoicePickerProps): JSX.Element => {

  const isFirstRender = useIsFirstRender();

  const { removeURLLimitAlert } = useAlert();

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);

  /**
   * The displayed checkboxes
   */
  const [checkboxRows, setCheckboxRows, checkboxRowsRef] = useStateRef<FacetCheckBoxRow[]>([]);

  /**
   * Whether there are more options or not
   */
  const [hasMore, setHasMore] = useState(false);

  /**
   * The search term that should be applied to the reference
   */
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  /**
   * Whether we should display "show more" if some items are hidden because of height
   */
  const [showFindMore, setShowFindMore] = useState(false);

  const listContainer = useRef<HTMLDivElement>(null);

  // populate facetReference and baseColumn that are used throughout the component
  let facetReference: any, baseColumn: any;
  if (facetColumn.isEntityMode) {
    facetReference = facetColumn.sourceReference.contextualize.compactSelect;
    baseColumn = facetColumn.column;
  } else {
    facetReference = facetColumn.scalarValuesReference;
    // the first column will be the value column
    baseColumn = facetReference.columns[0];
  }
  const baseColumnIsJSON = baseColumn.type.name === 'json' || baseColumn.type.name === 'jsonb';

  // make sure to add the search term
  if (searchTerm) {
    facetReference = facetReference.search(searchTerm);
  }

  // remove the constraints
  if (facetModel.noConstraints) {
    facetReference = facetReference.unfilteredReference;
    if (facetColumn.isEntityMode) {
      facetReference = facetReference.contextualize.compactSelect;
    }
  }

  /**
   * We must create references for the state and local variables that
   * are used in the flow-control related functions. This is to ensure the
   * functions are using thier latest values.
   */
  const facetColumnRef = useVarRef(facetColumn);
  const facetReferenceRef = useVarRef(facetReference);

  // maxCheckboxLen: Maximum number of checkboxes that we could show
  // NOTE given that these values won't change, it's safe to use this variable
  // in both render logic and flow-control related functions
  // (PAGE_SIZE + if not-null is allowed + if null is allowed)
  let maxCheckboxLen = FACET_PANEL_DEFAULT_PAGE_SIZE;
  if (!facetColumn.hideNotNullChoice) maxCheckboxLen++;
  if (!facetColumn.hideNullChoice) maxCheckboxLen++;

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

  /**
   * Generate the object that we want to be logged alongside the action
   * This function does not attach action, after calling this function
   * we should attach the action.
   */
  const getDefaultLogInfo = () => {
    let res = facetColumnRef.current.sourceReference.defaultLogInfo;
    res.stack = getFacetLogStack(facetIndex);
    return res;
  }

  //-------------------  flow-control related functions:   --------------------//
  /**
   * register the callbacks (this should be called after related state variables changed)
   */
  const callRegister = () => {
    register(facetIndex, processFacet, preProcessFacet, getAppliedFilters, removeAppliedFilters);
  };

  /**
   * The registered callback to pre-process facets
   */
  const preProcessFacet = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // if not_null exist, other filters are not relevant
      if (facetColumnRef.current.hasNotNullFilter) {
        // facetModel.appliedFilters.push(facetingUtils.getNotNullFilter(true));
        setCheckboxRows([getNotNullFacetCheckBoxRow(true)]);

        resolve(true);
      }
      else if (facetColumnRef.current.choiceFilters.length === 0) {
        resolve(true);
      }
      else {
        const res: FacetCheckBoxRow[] = [];

        // getChoiceDisplaynames won't return the null filter, so we need to check for it first
        if (facetColumnRef.current.hasNullFilter) {
          res.push(getNullFacetCheckBoxRow(true));
        }

        const facetLog = getDefaultLogInfo();
        facetLog.action = getFacetLogAction(facetIndex, LogActions.PRESELECTED_FACETS_LOAD);
        facetColumnRef.current.getChoiceDisplaynames(facetLog).then((filters: any) => {
          filters.forEach((f: any) => {
            res.push({
              uniqueId: f.uniqueId,
              displayname: f.displayname,
              tuple: f.tuple, // the returned tuple might be null (in case of scalar)
              selected: true
            });
          });

          $log.debug(`facet index=${facetIndex}: preprocessing done`);
          setCheckboxRows(res);

          // this timeout will ensure that the set state is done before resolving
          setTimeout(() => {
            resolve(true);
          }, 10);
        }).catch(function (error: any) {
          reject(error);
        });
      }

    });
  }

  /**
   * The registered callback to process and update facets
   */
  const processFacet = (reloadCauses: string[], reloadStartTime: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // we will set the checkboxRows to the value of this variable at the end
      const updatedRows: FacetCheckBoxRow[] = [];

      // add not-null filter if it should be added
      if (!facetColumnRef.current.hideNotNullChoice) {
        updatedRows.push(getNotNullFacetCheckBoxRow(facetColumnRef.current.hasNotNullFilter));
      }

      // add null filter if it should be added
      if (!facetColumnRef.current.hideNullChoice) {
        updatedRows.push(getNullFacetCheckBoxRow(facetColumnRef.current.hasNullFilter));
      }

      // add the already selected facets (except null and not-null since they are already added)
      updatedRows.push(...getAppliedFilters().filter((f) => !f.isNotNull && f.uniqueId !== null));

      // appliedLen: number of applied filters (apart from null and not-null)
      //if this is more than PAGE_SIZE, we don't need to read the data.
      let appliedLen = updatedRows.length;
      if (facetColumn.hasNullFilter) appliedLen--;
      if (facetColumn.hasNotNullFilter) appliedLen--;

      $log.debug(`facet index=${facetIndex}: start processing, already ${appliedLen} displayed filters.`);

      // there are more than PAGE_SIZE selected rows, just display them and don't fetch from the server.
      if (appliedLen >= FACET_PANEL_DEFAULT_PAGE_SIZE) {
        // there might be more, we're not sure
        processFavorites(updatedRows).then((res: boolean) => {

          setHasMore(true);
          setCheckboxRows(updatedRows);

          resolve(res);
        }).catch(function (err) {
          reject(err);
        });

        // this is needed to ensure we're skipping the request
        return;
      }

      (function (uri) {
        // the reload causes and stuff should be handled by the parent not here
        const facetLog = getDefaultLogInfo();

        // // create the action
        let action = LogActions.FACET_CHOICE_LOAD;
        if (reloadCauses.length > 0) {
          action = LogActions.FACET_CHOICE_RELOAD;
          // add causes
          facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
        }
        facetLog.action = getFacetLogAction(facetIndex, action);

        // update the filter log info to stack
        LogService.updateStackFilterInfo(facetLog.stack, facetReferenceRef.current.filterLogInfo);

        facetReferenceRef.current.read(FACET_PANEL_DEFAULT_PAGE_SIZE, facetLog, true).then((page: any) => {
          // if this is not the result of latest facet change
          if (facetReferenceRef.current.uri !== uri) {
            resolve(false);
            return;
          }

          setHasMore(page.hasNext);

          page.tuples.forEach(function (tuple: any) {
            // if we're showing enough rows
            if (updatedRows.length === maxCheckboxLen) {
              return;
            }

            // filter and tuple uniqueId might be different
            const value = getFilterUniqueId(tuple);

            const i = updatedRows.findIndex(function (row) {
              // ermrestjs always returns a string for uniqueId, but internally we don't
              // eslint-disable-next-line eqeqeq
              return row.uniqueId == value && !row.isNotNull;
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
        }).then((result: boolean) => {
          // if this is not the result of latest facet change
          if (facetReferenceRef.current.uri !== uri) {
            resolve(false);
            return;
          }

          $log.debug(`facet index=${facetIndex}: processing done`);
          setCheckboxRows(updatedRows);

          resolve(result);
        }).catch((err: any) => {
          reject(err);
        });
      })(facetReferenceRef.current.uri);
    });
  };

  /**
   * The registered callback to get the selected filters
   */
  const getAppliedFilters = (): FacetCheckBoxRow[] => {
    return checkboxRowsRef.current.filter((cbr: FacetCheckBoxRow) => cbr.selected);
  };

  /**
   * The registered callback to remove all the selected filters
   */
  const removeAppliedFilters = (): void => {
    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => {
        return { ...curr, selected: false }
      });
    });
  }

  /**
   * Given the tuple object, return the filter's uniqueId
   * the filter's uniqueId (in case of entityPicker, it might be different from the tuple's uniqueId)
   * @param  {Object} tuple      the tuple object
   * @return {string}            filter's uniqueId
   */
  const getFilterUniqueId = (tuple: any) => {
    if (tuple.data && baseColumn.name in tuple.data) {
      // if the column is JSON, we need to stringify it otherwise it will print [object Object]
      // NOTE this is the exact same logic as ermrestjs
      return baseColumnIsJSON ? JSON.stringify(tuple.data[baseColumn.name], undefined, 0) : tuple.data[baseColumn.name];
    }
    return tuple.uniqueId;
  }

  const processFavorites = (rows: FacetCheckBoxRow[]): Promise<boolean> => {
    return new Promise((resolve) => {
      // TODO favorites
      resolve(true);
    });
  };

  //-------------------  UI related callbacks:   --------------------//

  /**
   * The registered callback in search-input
   * This will not directly trigger flow-control update and will only change the searchTerm
   */
  const searchCallback = (term: string | null, action: LogActions) => {
    if (term) term = term.trim();

    // make sure adding the search doesn't go above the URL length limit
    const ref = facetReferenceRef.current.search(term);
    if (checkReferenceURL(ref)) {

      // log the client action
      const extraInfo = isStringAndNotEmpty(searchTerm) ? { 'search-str': searchTerm } : {};
      LogService.logClientAction({
        action: getFacetLogAction(facetIndex, action),
        stack: getFacetLogStack(facetIndex, extraInfo)
      }, facetColumn.sourceReference.defaultLogInfo);

      setSearchTerm(term);
    }
  }

  const openRecordsetModal = () => {
    const uiContextTitles = recordsetUIContextTitles ? [...recordsetUIContextTitles] : [];

    const recordsetConfig: RecordsetConfig = {
      viewable: false,
      editable: false,
      deletable: false,
      sortable: true,
      selectMode: RecordsetSelectMode.MULTI_SELECT,
      disableFaceting: !facetColumn.isEntityMode,
      displayMode: RecordsetDisplayMode.FACET_POPUP,
      facetDepthLevel: recordsetFacetDepthLevel + 1
      // TODO
      // enableFavorites
    };

    const logInfo = {
      logStack: LogService.addExtraInfoToStack(getDefaultLogInfo().stack, { picker: 1 }),
      logStackPath: LogService.getStackPath(facetModel.parentLogStackPath, LogStackPaths.FACET_POPUP),
    };

    const initialSelectedRows: SelectedRow[] = [];
    checkboxRows.forEach(function (row) {
      if (!row.selected) return;
      let rowUniqueId, rowData;

      // mimic the same structure as tuples
      // - row.uniqueId will return the filter's uniqueId and not
      //    the tuple's. We need tuple's uniqueId in here
      //    (it will be used in the logic of isSelected in modal).
      // - data is needed for the post process that we do on the data.
      if (row.tuple && row.tuple.data && facetColumn.isEntityMode) {
        rowUniqueId = row.tuple.uniqueId;
        rowData = row.tuple.data;
      } else {
        rowUniqueId = row.uniqueId;
      }
      initialSelectedRows.push({
        uniqueId: rowUniqueId,
        displayname: (rowUniqueId === null) ? { value: null, isHTML: false } : row.displayname,
        data: rowData,
      });
    });

    // if url limitation alert exists, remove it.
    removeURLLimitAlert();


    uiContextTitles.push(
      { displayname: facetColumn.displayname, comment: facetColumn.comment }
    )

    setRecordsetModalProps({
      initialReference: facetReferenceRef.current,
      initialPageLimit: RECORDSET_DEFAULT_PAGE_SIZE,
      config: recordsetConfig,
      logInfo,
      initialSelectedRows,
      uiContextTitles
    });
  };

  const modalDataChanged = (isSubmit: boolean) => {
    return (selectedRows: SelectedRow[]) => {
      // create the list of choice filters
      let hasNull = false;
      const filters = selectedRows.map(function (t: any) {
        const val = getFilterUniqueId(t);
        hasNull = hasNull || (val === null);
        return val;
      });

      // create the reference using filters
      const ref = facetColumn.replaceAllChoiceFilters(filters);

      // update the reference
      if (!updateRecordsetReference(ref, facetIndex, LogReloadCauses.FACET_MODIFIED, !isSubmit, true)) {
        return false;
      }

      if (isSubmit) {
        // we will set the checkboxRows to the value of this variable at the end
        const updatedRows: FacetCheckBoxRow[] = [];
        // add not-null filter
        if (!facetColumn.hideNotNullChoice) {
          updatedRows.push(getNotNullFacetCheckBoxRow());
        }
        // add null filter
        if (!facetColumn.hideNullChoice || hasNull) {
          updatedRows.push(getNullFacetCheckBoxRow(hasNull));
        }

        selectedRows.forEach((row: any) => {
          // filter and tuple uniqueId might be different
          const value = getFilterUniqueId(row);

          updatedRows.push({
            selected: true,
            uniqueId: value,
            displayname: row.displayname,
            tuple: row
          });
        });

        // hide the modal
        hideRecordsetModal();

        // set the selected rows
        setCheckboxRows(updatedRows);
      }

      return true;
    };
  }

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  };

  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number, event: any) => {
    const checked = !row.selected;
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
      return prev.map((curr: FacetCheckBoxRow) => {
        if (curr === row) return { ...curr, selected: checked };
        // if not-null is selected, remove all the other filters
        else if (row.isNotNull && checked) return { ...curr, selected: false }
        else return curr;
      });
    });
  };

  const retryQuery = (noConstraints: boolean) => {
    // ask the parent to update the facet column
    dispatchFacetUpdate(facetIndex, true, LogReloadCauses.FACET_RETRY, noConstraints);
  }

  //-------------------  render logic:   --------------------//
  // number of rows that are selected and not visible to users
  // NOTE given that this is using checkboxRows, it's only safe to use for render
  // logic and should not be used by flow-control related functions.
  const hiddenSelectedCount = checkboxRows.filter((r: FacetCheckBoxRow, i: number) => (
    i >= maxCheckboxLen && r.selected
  )).length;

  const recordsetModalClassName = [
    'faceting-show-details-popup',
    `faceting-show-details-popup-depth-${recordsetFacetDepthLevel}`
  ];
  if (!facetColumn.isEntityMode) {
    recordsetModalClassName.push('scalar-show-details-popup');
  }

  const renderPickerContainer = () => {
    const useShowMore = (hasMore || showFindMore);

    let showMoreTooltip = 'Click here to see more information about available items.';
    if (hiddenSelectedCount > 0) {
      // TODO maybe saying 'all' is misleading as the selected items might not be displayed on the first page.
      showMoreTooltip = 'Click here to show all selected items and available items with details.';
    } else if (useShowMore) {
      showMoreTooltip = 'Click here to show more available items with details.';
    }

    return (
      <div className='picker-container'>
        {facetColumn.column.type.name !== 'boolean' &&
          <SearchInput
            // NOTE the initial search term is always empty
            initialSearchTerm={''}
            inputClass='facet-search-input'
            searchCallback={searchCallback}
            searchColumns={facetColumn.isEntityMode ? facetColumn.sourceReference.searchColumns : null}
            disabled={facetColumn.hasNotNullFilter}
          />
        }
        <div ref={listContainer}>
          <FacetCheckList
            setHeight={facetModel.isOpen && facetModel.initialized && facetPanelOpen}
            rows={checkboxRows} hasNotNullFilter={facetColumn.hasNotNullFilter}
            onRowClick={onRowClick} maxDisplayedRows={maxCheckboxLen}
          />
        </div>
        {hiddenSelectedCount > 0 &&
          <span className='more-filters'>
            <span className='fa-solid fa-triangle-exclamation' />
            <span className='more-filters-text'> {hiddenSelectedCount} selected items not displayed.</span>
          </span>
        }
        <div className='button-container'>
          {/* TODO id='show-more' removed */}
          <ChaiseTooltip placement='right' tooltip={showMoreTooltip}>
            <button
              className='chaise-btn chaise-btn-sm chaise-btn-tertiary show-more-btn'
              disabled={facetColumn.hasNotNullFilter}
              onClick={() => openRecordsetModal()}
            >
              <span className='chaise-btn-icon far fa-window-restore'></span>
              <span>{useShowMore ? 'Show more' : 'Show details'}</span>
            </button>
          </ChaiseTooltip>
          {facetModel.noConstraints &&
            <ChaiseTooltip
              tooltip='Retry updating the facet values with constraints.'
              placement='bottom-start'
            >
              <button className='chaise-btn chaise-btn-sm chaise-btn-tertiary retry-btn' onClick={() => retryQuery(false)}>
                Retry
              </button>
            </ChaiseTooltip>
          }
        </div>
      </div>
    )
  };

  const renderErrorContainer = () => {
    return (
      <div className='error-container'>
        <div>
          Request timeout: The facet values cannot be retrieved. Try the following to reduce the query time:
          <ul className='show-list-style'>
            <li>Reduce the number of facet constraints.</li>
            <li>Minimize the use of <i>No value</i> and <i>All records with value</i> filters.</li>
          </ul>
          Click <strong>Simplify</strong> to retrieve facet values without constraints.
        </div>
        <div>
          <ChaiseTooltip
            placement='bottom-start'
            tooltip={'Retry updating the facet values with constraints.'}
          >
            <button className='chaise-btn chaise-btn-primary' onClick={() => retryQuery(false)}>Retry</button>
          </ChaiseTooltip>
          <ChaiseTooltip
            placement='bottom-start'
            tooltip={'Provide facet values without any constraints applied.'}
          >
            <button className='chaise-btn chaise-btn-primary' onClick={() => retryQuery(true)}>Simplify</button>
          </ChaiseTooltip>
        </div>
      </div>
    )
  }

  return (
    <div className='choice-picker'>
      {!facetModel.facetHasTimeoutError && renderPickerContainer()}
      {facetModel.facetHasTimeoutError && renderErrorContainer()}
      {
        recordsetModalProps &&
        <RecordsetModal
          modalClassName={recordsetModalClassName.join(' ')}
          recordsetProps={recordsetModalProps}
          onClose={hideRecordsetModal}
          onSubmit={modalDataChanged(true)}
          displayname={facetColumn.displayname}
          onSelectedRowsChanged={modalDataChanged(false)}
          comment={facetColumn.comment}
        />
      }
    </div>
  )
}

export default FacetChoicePicker;
