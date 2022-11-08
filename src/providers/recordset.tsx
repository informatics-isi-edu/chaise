import { createContext, useEffect, useMemo, useRef, useState } from 'react';

// hooks
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { LogActions, LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetProviderAddUpdateCauses,
  RecordsetProviderFetchSecondaryRequests,
  RecordsetProviderUpdateMainEntity, SelectedRow
} from '@isrd-isi-edu/chaise/src/models/recordset';


// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import RecordsetFlowControl from '@isrd-isi-edu/chaise/src/services/recordset-flow-control';

// utils
import { RECORDSET_DEAFULT_PAGE_SIZE, URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getColumnValuesFromPage } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import Q from 'q';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

/**
 * types related to the update function
 */
type UpdatePageStates = {
  /**
   * whether we should trigger update for main result
   */
  updateResult?: boolean,
  /**
   * whether we should trigger update for main count
   */
  updateCount?: boolean,
  /**
   * whether we should trigger update for open facets
   */
  updateFacets?: boolean
};
type UpdateNewValues = {
  /**
   * The new reference value that should be used
   */
  reference?: any,
  /**
   * The new page limit value that should be used
   */
  pageLimit?: number
};
type UpdateOptions = {
  /**
   * Whether we should use the same flow-control counter
   * Note: Use this when the update is just a refresh and not because of updated state
   */
  sameCounter?: boolean,
  /**
   * The reload cause
   */
  cause?: string,
  /**
   * The last active facet that should not be updated
   * (if it's an invalid value like -1, we will update all the open facets)
   */
  lastActiveFacet?: number,
  /**
   * reset the initialized state of all the open facets
   * (when we wnat to reset the state of the page completely, .e.g.  page update after search-popup submit)
   */
  resetAllOpenFacets?: boolean
}

export const RecordsetContext = createContext<{
  /**
   * The displayed reference
   */
  reference: any,
  /**
   * Whether the main data is loading or not (and therefore we need spinner or not)
   */
  isLoading: boolean,
  /**
   * whether we got a timeout error while fetching main entity
   */
  hasTimeoutError: boolean,
  /**
   * whether we got a timeout error while fetching count
   */
  totalRowCountHasTimeoutError: boolean
  /**
   * Whether the main data has been initialized or not
   */
  isInitialized: boolean,
  /**
   * Call this function to initialize the recordset data
   */
  initialize: () => void,
  /**
   * Can be used to trigger update on any parts of the page
   */
  update: (pageStates: UpdatePageStates | null, newValues: UpdateNewValues | null, options?: UpdateOptions) => boolean,
  /**
   * The page limit (number of rows that we're fetching for each page)
   */
  pageLimit: any,
  /**
   * The displayed page
   */
  page: any,
  /**
   * An array of column values
   * NOTE we're using colValues instead of rowValues to make the aggregate logic easier.
   */
  colValues: any,
  /**
   * The rows that should be disabled
   */
  disabledRows: any,
  /**
   * The rows that are selected
   */
  selectedRows: SelectedRow[],
  /**
   * A function that can be used for setting the selected rows.
   * You can either pass an array, or a function that returns an array.
   */
  setSelectedRows: (param: SelectedRow[] | ((prevRows: SelectedRow[]) => SelectedRow[])) => void,
  /**
   * The columns that are displayed
   */
  columnModels: any,
  /**
   * The total row count number (if null, we don't want to show the total count)
   */
  totalRowCount: number | null,
  /**
   * A function that can be used to register the facet callbacks
   */
  registerFacetCallbacks: (updateFacetStatesCallback: Function, updateFacetsCallback: Function) => void,
  /**
   * Can be used for printing debug messages related to flow-control logic
   * (will append the proper count)
   */
  printDebugMessage: (message: string, counter?: number) => void,
  /**
   * given a reference will check the url length, and if it's above the limit:
   *   - will show an alert
   *   - will return false
   * otherwise it will return true.
   */
  checkReferenceURL: (ref: any, showAlert?: boolean) => boolean,
  /**
   * if true, we have to forcefully show the spinner
   */
  forceShowSpinner: boolean,
  /**
   * can be used to force showing of the spinner
   */
  setForceShowSpinner: Function,
  /**
   * log client actions
   * Notes:
   *   - the optional `ref` parameter can be used to log based on a different reference object
   */
  logRecordsetClientAction: (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => void,
  /**
   * get the appropriate log action
   */
  getLogAction: (actionPath: LogActions, childStackPath?: any) => string,
  /**
   * get the appropriate log stack
   */
  getLogStack: (childStackElement?: any, extraInfo?: any) => any,
  /**
   * manually trigger the request for the main entity
   */
  updateMainEntity: RecordsetProviderUpdateMainEntity,
  /**
   * manually trigger the update for the secondary requests
   */
  fetchSecondaryRequests: RecordsetProviderFetchSecondaryRequests,
  /**
   * manually add update cases and set the dirty flag
   */
  addUpdateCauses: RecordsetProviderAddUpdateCauses,
  /**
   * The parent page's reference
   */
  parentPageReference?: any,
  /**
   * The parent page's tuple
   */
  parentPageTuple?: any,
}
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  | null>(null);

type RecordsetProviderProps = {
  /**
   * The inner element (will be the recordset component)
   */
  children: JSX.Element,
  /**
   * The initial reference
   */
  initialReference: any,
  /**
   * The initial page limit
   */
  initialPageLimit: any,
  /**
   * The recordset config
   */
  config: RecordsetConfig,
  /**
   * log related props
   */
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  },
  /**
   * A callback to get the favorites (used in facet popup)
   */
  getFavorites?: Function,
  /**
   * A callback to get the disabeld tuples (used in p&b popup)
   */
  getDisabledTuples?: Function,
  /**
   * The initially selected rows (used in facet popup)
   */
  initialSelectedRows?: SelectedRow[],
  /**
   * The callback that should be called when selected rows changes
   * If it returns a false, the selected rows won't change.
   */
  onSelectedRowsChanged?: (selectedRows: SelectedRow[]) => boolean,
  /**
   * The callback that should be called when favorites changed
   */
  onFavoritesChanged?: Function,
  /**
   * The parent page's reference
   */
  parentReference?: any,
  /**
   * The parent page's tuple
   */
  parentTuple?: any,
}

export default function RecordsetProvider({
  children,
  initialReference,
  initialPageLimit,
  config,
  logInfo,
  getFavorites,
  getDisabledTuples,
  initialSelectedRows,
  onSelectedRowsChanged,
  onFavoritesChanged,
  parentReference,
  parentTuple
}: RecordsetProviderProps): JSX.Element {
  const { dispatchError } = useError();
  const { addURLLimitAlert, removeURLLimitAlert } = useAlert();

  const [reference, setReference, referenceRef] = useStateRef<any>(initialReference);

  const [parentPageReference, setPageParentReference] = useState(parentReference);
  const [parentPageTuple, setPageParentTuple] = useState(parentTuple);

  /**
   * whether the component has initialized or not
   */
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading, isLoadingRef] = useStateRef(true);
  const [pageLimit, setPageLimit, pageLimitRef] = useStateRef(typeof initialPageLimit === 'number' ? initialPageLimit : RECORDSET_DEAFULT_PAGE_SIZE);
  const [page, setPage, pageRef] = useStateRef<any>(null);
  const [colValues, setColValues] = useState<any>([]);
  /**
   * The columns that should be displayed in the result table
   */
  const [columnModels, setColumnModels] = useState(
    initialReference.columns.map((col: any) => {
      return {
        column: col,
        isLoading: col.hasWaitFor === true || col.isUnique === false,
        hasError: false
      };
    })
  );
  const setColumnModelValues = (indexes: { [key: string]: any }, values: { [key: string]: boolean }) => {
    setColumnModels(
      (prevColumnModels: any) => {
        return prevColumnModels.map((cm: any, index: number) => {
          return (index in indexes) ? { ...cm, ...values } : cm;
        });
      }
    )
  };

  const [totalRowCount, setTotalRowCount] = useState<number | null>(null);

  const [disabledRows, setDisabledRows] = useState<any>([]);

  /**
   * The selected rows
   */
  const [selectedRows, setStateSelectedRows] = useState<SelectedRow[]>(() => {
    return Array.isArray(initialSelectedRows) ? initialSelectedRows : [];
  });
  /**
   * A wrapper for the set state function to first call the onSelectedRowsChanged
   *
   * if case of facet popup, "false" means:
   *   - show the url length error
   * in other cases it means stop changing the selected rows
   */
  const setSelectedRows = (param: SelectedRow[] | ((prevRows: SelectedRow[]) => SelectedRow[])): void => {
    setStateSelectedRows((prevRows: SelectedRow[]) => {
      const res = typeof param === 'function' ? param(prevRows) : param;
      if (onSelectedRowsChanged) {
        const temp = onSelectedRowsChanged(res);
        if (config.displayMode === RecordsetDisplayMode.FACET_POPUP) {
          if (temp === false) {
            addURLLimitAlert();
          } else {
            removeURLLimitAlert();
          }
        } else {
          return temp === false ? prevRows : res;
        }

      }
      return res;
    });
  };

  const [forceShowSpinner, setForceShowSpinner] = useState(false);

  const [hasTimeoutError, setHasTimeoutError] = useState(false);
  const [totalRowCountHasTimeoutError, setHasCountTimeoutError] = useState(false);

  const flowControl = useRef(new RecordsetFlowControl(initialReference, logInfo));

  // call the flow-control after each reference object
  useEffect(() => {
    processRequests();
  }, [pageLimit, reference]);

  // after the main data has loaded, we can get the secondary data
  useEffect(() => {
    // TODO does this make sense?
    // in case of related entities, record page will take care of this
    if (config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0) {
      return;
    }

    if (!isLoading && page && page.length > 0) {
      fetchSecondaryRequests(processRequests);
    }
  }, [isLoading, page]);

  const logRecordsetClientAction = (action: LogActions, childStackElement?: any, extraInfo?: any, ref?: any) => {
    const usedRef = ref ? ref : referenceRef.current;
    LogService.logClientAction({
      action: flowControl.current.getLogAction(action),
      stack: flowControl.current.getLogStack(childStackElement, extraInfo)
    }, usedRef.defaultLogInfo)
  };

  const getLogAction = (actionPath: LogActions, childStackPath?: any) => {
    return flowControl.current.getLogAction(actionPath, childStackPath);
  }

  const getLogStack = (childStackElement?: any, extraInfo?: any) => {
    return flowControl.current.getLogStack(childStackElement, extraInfo);
  }

  const checkReferenceURL = (ref: any, showAlert = true): boolean => {
    const ermrestPath = ref.isAttributeGroup ? ref.ermrestPath : ref.readPath;
    if (ermrestPath.length > URL_PATH_LENGTH_LIMIT || ref.uri.length > URL_PATH_LENGTH_LIMIT) {

      $log.warn('url length limit will be reached!');

      // show the alert (the function will handle just showing one alert)
      if (showAlert) {
        addURLLimitAlert();
      }

      // TODO I should be able to pass the function from the comp to this provider
      // // scroll to top of the container so users can see the alert
      // scrollMainContainerToTop();

      // signal the caller that we reached the URL limit.
      return false;
    }

    // remove the alert if it's present since we don't need it anymore
    if (showAlert) {
      removeURLLimitAlert();
    }
    return true;
  };

  const printDebugMessage = (message: string, counter?: number): void => {
    counter = typeof counter !== 'number' ? flowControl.current.queue.counter : counter;
    $log.debug(`counter ${counter}: ` + message);
  };

  /**
   * This should be called to start the initialization of recordset page.
   * It will set the flags, and then call the actual update function.
   */
  const initialize = () => {
    flowControl.current.dirtyResult = true;
    flowControl.current.dirtyCount = true;
    flowControl.current.queue.counter = 0;

    // just initiate the flow control without providing an new values
    update(null, null);
  };

  /**
   * Based on the given inputs, it will set the state of different parts
   * of recordset directive to be updated.
   *
   * @param  {ERMrest.Reference} newRef if we want to also update the reference
   * @param  {boolean} updateResult if it's true we will update the table.
   * @param  {boolean} updateCount  if it's true we will update the displayed total count.
   * @param  {boolean} updateFacets if it's true we will udpate the opened facets.
   * @param  {boolean} sameCounter if it's true, the flow-control counter won't be updated.
   * @param  {string?} cause why we're calling this function (optional)
   * @param  {number?} lastActiveFacet the facet that has been active and should rename active
   * NOTE: we're passing newRef here to ensure the reference and flowControl object are updated together
   * NOTE: sameCounter=true is used just to signal that we want to get results of the current
   * page status. For example when a facet opens or when users add a search term to a single facet.
   * we don't want to update the whole page in that case, just the facet itself.
   * If while doing so, the whole page updates, the updateFacet function itself should ignore the
   * stale request by looking at the request url.
   */
  const update = (pageStates: UpdatePageStates | null, newValues: UpdateNewValues | null, options?: UpdateOptions) => {

    // page state variables:
    const updateResult = pageStates !== null && pageStates.updateResult === true;
    const updateCount = pageStates !== null && pageStates.updateCount === true;
    const updateFacets = pageStates !== null && pageStates.updateFacets === true;

    // new values:
    const newRef = (newValues !== null && newValues.reference) ? newValues.reference : undefined;
    const limit = (newValues !== null && newValues.pageLimit) ? newValues.pageLimit : undefined;

    // options:
    const sameCounter = typeof options !== 'undefined' && options.sameCounter === true;
    const cause = typeof options !== 'undefined' && typeof options.cause === 'string' ? options.cause : undefined;
    const resetAllOpenFacets = typeof options !== 'undefined' && options.resetAllOpenFacets === true;


    printDebugMessage(`update called with res=${updateResult}, cnt=${updateCount}, facets=${updateFacets}, sameCnt=${sameCounter}, cause=${cause}`);

    if (newRef && !checkReferenceURL(newRef)) {
      return false;
    }

    if (options && typeof options.lastActiveFacet === 'number') {
      flowControl.current.lastActiveFacet = options.lastActiveFacet;
    }

    if (updateFacets) {
      if (flowControl.current.updateFacetStatesCallback) {
        flowControl.current.updateFacetStatesCallback(flowControl, resetAllOpenFacets, cause);
      }
    }

    if (updateResult) {
      addUpdateCauses([cause]);
    }

    if (updateCount) {
      if (!Number.isInteger(flowControl.current.recountStartTime) || flowControl.current.recountStartTime === -1) {
        flowControl.current.recountStartTime = ConfigService.ERMrest.getElapsedTime();
      }
      if (cause && flowControl.current.recountCauses.indexOf(cause) === -1) {
        flowControl.current.recountCauses.push(cause);
      }
    }

    // if it's true change, otherwise don't change.
    flowControl.current.dirtyResult = updateResult || flowControl.current.dirtyResult;

    // change loading only if the caller asked for updating the result
    if (updateResult) {
      setIsLoading(flowControl.current.dirtyResult);
    }

    flowControl.current.dirtyCount = updateCount || flowControl.current.dirtyCount;

    if (!sameCounter) {
      flowControl.current.queue.counter++;
      $log.debug(`adding one to counter, new: ${flowControl.current.queue.counter}`);
    }

    // processRequests is called as a result of updating the reference
    // we cannot ensure that the reference is latest, so we cannot call processRequests
    if (newRef) {
      // after react sets the reference, the useEffect will trigger processRequests
      setReference(newRef);
    } else if (limit && typeof limit === 'number') {
      setPageLimit(limit);
    } else {
      processRequests();
    }

    return true;
  };

  const addUpdateCauses = (causes: any[], setDirtyResult?: boolean, queue?: FlowControlQueueInfo) => {
    if (queue) {
      flowControl.current.queue = queue;
    }

    if (setDirtyResult) {
      flowControl.current.dirtyResult = true;
    }

    flowControl.current.addCauses(causes);
  };

  const processRequests = () => {
    printDebugMessage('running update page');

    if (!flowControl.current.haveFreeSlot()) {
      return;
    }

    // make sure the logStack has the latest filters
    // NOTE in related section we don't want the filter info to be captured,
    //      as we're already doing that with 'source'
    if (config.displayMode.indexOf(RecordsetDisplayMode.RELATED) !== 0) {
      LogService.updateStackFilterInfo(
        flowControl.current.getLogStack(),
        referenceRef.current.filterLogInfo,
        // in fullscreen mode, we want the global log stack to have filter info too
        // (this is for requests outside of recordset component like export)
        config.displayMode === RecordsetDisplayMode.FULLSCREEN
      );
    }

    // update the resultset
    updateMainEntity(processRequests);

    // the aggregates are updated when the main entity request is done

    // do not fetch table count if hideRowCount is set in the annotation for the table
    // this is because the query takes too long sometimes
    if (!referenceRef.current.display || !referenceRef.current.display.hideRowCount) {
      // update the count
      updateTotalRowCount(processRequests);
    }

    if (!isLoadingRef.current && pageRef.current && pageRef.current.length > 0) {
      fetchSecondaryRequests(processRequests);
    }

    // fetch the facets
    if (flowControl.current.updateFacetsCallback) {
      flowControl.current.updateFacetsCallback(flowControl, processRequests);
    }

  };

  /**
 * Given the tableModel object, will get the values for main entity and
 * attach them to the model.
 * @param  {function} processRequestsCB The update page callback which we will call after getting the result.
 * @param  {object} notTerminal  Indicates whether we should show a terminal error or not for 400 QueryTimeoutError
 * @param {object} cb a callback that will be called after the read is done and is successful.
 */
  const updateMainEntity = (processRequestsCB: Function, notTerminal = false, cb?: Function) => {
    if (!flowControl.current.dirtyResult || !flowControl.current.haveFreeSlot()) {
      return;
    }

    flowControl.current.queue.occupiedSlots++;
    flowControl.current.dirtyResult = false;

    (function (currentCounter) {
      printDebugMessage('updating result', currentCounter);
      readMainEntity(currentCounter).then((res: any) => {
        afterUpdateMainEntity(res.success, currentCounter);

        setHasTimeoutError(false);
        if (cb) cb(res);
        // TODO remember last successful main request
        // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
        processRequestsCB();
      }).catch((err: any) => {
        afterUpdateMainEntity(true, currentCounter);
        if (cb) cb(self, true);

        // show modal with different text if 400 Query Timeout Error
        if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
          // clear the data shown in the table
          setPage(null);
          setColValues([]);

          setHasTimeoutError(true);
          if (!notTerminal) {
            err.subMessage = err.message;
            err.message = `The result set cannot be retrieved. Try the following to reduce the query time:\n${MESSAGE_MAP.queryTimeoutList}`;
            dispatchError({ error: err, isDismissible: true });
            return;
          }
        }
        dispatchError({ error: err });
      });
    }(flowControl.current.queue.counter));
  }

  /**
   * @private
   * This will be called after updateMainEntity. which will set the flags
   * based on success or failure of request.
   */
  const afterUpdateMainEntity = (res: boolean, counter: number) => {
    flowControl.current.queue.occupiedSlots--;
    flowControl.current.dirtyResult = !res;
    if (res) {
      setIsLoading(false);
    }

    printDebugMessage(`after result update: ${res ? 'successful.' : 'unsuccessful.'}, old cnt=${counter}`);
  }

  const readMainEntity = (counterer: number) => {
    flowControl.current.dirtyResult = false;
    setIsLoading(true);

    const defer = Q.defer();
    const logParams: any = flowControl.current.logObject ? flowControl.current.logObject : {};

    const reloadCauses = flowControl.current.reloadCauses;
    const hasCauses = Array.isArray(reloadCauses) && reloadCauses.length > 0;
    const act = hasCauses ? LogActions.RELOAD : LogActions.LOAD;

    // add reloadCauses
    const usedLogStack = hasCauses ?
      LogService.addCausesToStack(flowControl.current.getLogStack(), reloadCauses, flowControl.current.reloadStartTime) :
      flowControl.current.getLogStack();

    const usedLogStackPath = logInfo.logStackPath;

    logParams.stack = usedLogStack;

    // create the action
    logParams.action = flowControl.current.getLogAction(act);

    (function (current, requestCauses, reloadStartTime) {
      // the places that we want to show edit or delete button, we should also ask for trs
      // NOTE technically this should be based on passed config options but we're passing editable
      //      to mean both edit and create, so it's not really useful here
      const getTRS = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0
        || config.displayMode === RecordsetDisplayMode.FULLSCREEN;

      // if it's in related entity section, we should fetch the
      // unlink trs (acl) of association tables
      const getUnlinkTRS = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0
        && referenceRef.current.derivedAssociationReference;

      referenceRef.current.read(pageLimitRef.current, logParams, false, false, getTRS, false, getUnlinkTRS).then((pageRes: any) => {
        if (current !== flowControl.current.queue.counter) {
          defer.resolve({ success: false, page: null });
          return defer.promise;
        }

        printDebugMessage('read main successful.', current);

        return getFavorites ? getFavorites(pageRes) : { page: pageRes };
      }).then((result: any) => {
        if (getDisabledTuples) {
          return getDisabledTuples(result.page, pageLimitRef.current, usedLogStack, usedLogStackPath, requestCauses, reloadStartTime);
        } else {
          return { page: result.page };
        }
      }).then((result: { page: any, disabledRows?: any }) => {
        if (current !== flowControl.current.queue.counter) {
          defer.resolve({ success: false, page: null });
          return defer.promise;
        }

        setIsInitialized(true);
        setPage(result.page);
        setColValues(getColumnValuesFromPage(result.page));

        // update the objects based on the new page
        if (Array.isArray(result.page.templateVariables)) {
          flowControl.current.templateVariables = result.page.templateVariables.map((tv: any) => tv.values);
        } else {
          flowControl.current.templateVariables = [];
        }
        flowControl.current.aggregateResults = new Array(result.page.tuples.length);

        // if the getDisabledTuples was defined, this will have a value
        if (result.disabledRows) {
          setDisabledRows(result.disabledRows);
        }

        // make sure we're getting the data for aggregate columns
        flowControl.current.requestModels.forEach((agg: any) => {
          if (result.page.length > 0) {
            agg.processed = false;
            agg.reloadCauses = requestCauses;
            if (!Number.isInteger(agg.reloadStartTime) || agg.reloadStartTime === -1) {
              agg.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
            }
          } else {
            agg.processed = true;

            // there are not matching rows, so there's no point in creating
            // aggregate requests.
            // make sure the spinner is hidden for the pending columns.
            const updatedColumnModels: any = {};
            agg.activeListModel.objects.forEach((obj: any) => {
              if (obj.column && columnModels[obj.index].isLoading) {
                updatedColumnModels[obj.index] = true;
              }
            });

            setColumnModelValues(updatedColumnModels, { isLoading: false });
          }
        });

        // empty the causes since now we're showing the value.
        flowControl.current.reloadCauses = [];
        flowControl.current.reloadStartTime = -1;

        defer.resolve({ success: true, page: result.page });
      }).catch((err: any) => {
        if (current !== flowControl.current.queue.counter) {
          return defer.resolve({ success: false, page: null });
        }

        setIsInitialized(true);

        // globally sets when the app state is ready to interact with
        // TODO is this needed?
        // $rootScope.displayReady = true;
        if (isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
          err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
        }
        defer.reject(err);
      });

      // clear logObject since it was used just for the first request
      flowControl.current.logObject = {};
    }(counterer, flowControl.current.reloadCauses, flowControl.current.reloadStartTime));
    return defer.promise;
  }


  const updateTotalRowCount = (processRequestsCB: Function) => {
    if (!flowControl.current.dirtyCount || !flowControl.current.haveFreeSlot()) {
      return;
    }

    flowControl.current.queue.occupiedSlots++;
    flowControl.current.dirtyCount = false;

    (function (curr) {
      fetchTotalRowCount(curr).then((res: any) => {
        afterUpdateTotalRowCount(res, curr);
        processRequestsCB();
      }).catch(function (err: any) {
        afterUpdateTotalRowCount(true, curr);
        dispatchError({ error: err });
      });
    })(flowControl.current.queue.counter);
  }

  /**
   * This will generate the request for getting the count.
   * Returns a promise. If it's resolved with `true` then it has been successful.
   */
  const fetchTotalRowCount = (current: number) => {
    printDebugMessage('fetching the main count');
    const defer = Q.defer();
    let aggList, hasError;
    try {
      // if the table doesn't have any simple key, this might throw error
      aggList = [referenceRef.current.aggregate.countAgg];
    } catch (exp) {
      hasError = true;
    }
    if (hasError) {
      setTotalRowCount(null);
      defer.resolve(true);
      return defer.promise;
    }

    const hasCauses = Array.isArray(flowControl.current.recountCauses) && flowControl.current.recountCauses.length > 0;
    const action = hasCauses ? LogActions.RECOUNT : LogActions.COUNT;
    let stack = flowControl.current.getLogStack();
    if (hasCauses) {
      stack = LogService.addCausesToStack(stack, flowControl.current.recountCauses, flowControl.current.recountStartTime);
    }
    referenceRef.current.getAggregates(
      aggList,
      { action: flowControl.current.getLogAction(action), stack: stack }
    ).then((response: any) => {
      if (current !== flowControl.current.queue.counter) {
        defer.resolve(false);
        return defer.promise;
      }

      setHasCountTimeoutError(false);
      setTotalRowCount(response[0]);


      flowControl.current.recountCauses = [];
      flowControl.current.recountStartTime = -1;

      defer.resolve(true);
    }).catch(function (err: any) {
      if (current !== flowControl.current.queue.counter) {
        defer.resolve(false);
        return defer.promise;
      }

      if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
        setHasCountTimeoutError(true);
      }

      // fail silently
      setTotalRowCount(null);
      return defer.resolve(true), defer.promise;
    });

    return defer.promise;
  }

  /**
   * will be called after getting data for count to set the flags.
   */
  const afterUpdateTotalRowCount = (res: boolean, current: number) => {
    flowControl.current.queue.occupiedSlots--;
    flowControl.current.dirtyCount = !res;
    printDebugMessage(`after update total row count: ${res ? 'successful.' : 'unsuccessful.'}, old cnt=${current}`);
  }

  /**
   * get values for the secondary requests (aggregate columns, etc).
   * The updateMainEntity should be called on the tableModel before this function.
   * That function will generate `vm.page` which is needed for this function
   * @param  {function} processRequestsCB The update page callback which we will call after getting each result.
   * @param  {boolean} hideSpinner?  Indicates whether we should show spinner for columns or not
   */
  const fetchSecondaryRequests = (processRequestsCB: Function, hideSpinner?: boolean) => {
    // if the data is still loading, don't fetch the secondary requests
    if (isLoadingRef.current) return;

    flowControl.current.requestModels.forEach((aggModel: any, index: number) => {
      if (!flowControl.current.haveFreeSlot() || aggModel.processed) {
        return;
      }

      flowControl.current.queue.occupiedSlots++;

      aggModel.processed = true;

      printDebugMessage(`getting aggregated values for column (index=${index})`);
      updateColumnAggregate(aggModel, flowControl.current.queue.counter, hideSpinner).then((res: any) => {
        flowControl.current.queue.occupiedSlots--;
        aggModel.processed = res;

        printDebugMessage(`: after aggregated value for column (index=${index}) update: ${res ? 'successful.' : 'unsuccessful.'}`);
        processRequestsCB();
      }).catch((err: any) => {
        dispatchError({ error: err });
      });
    });
  };

  /**
   * @private
   * Generate request for each individual aggregate columns. Will return
   * a promise that is resolved with a boolean value denoting the success or failure.
   * A rejected promise should be displayed as an error.
   */
  const updateColumnAggregate = (aggModel: any, current: number, hideSpinner?: boolean) => {
    const defer = Q.defer(),
      activeListModel = aggModel.activeListModel;

    // show spinner for all the dependent columns
    const updatedColumnModels: any = {};
    activeListModel.objects.forEach((obj: any) => {
      // this is only called in recordset so it won't be related
      if (obj.column) {
        updatedColumnModels[obj.index] = true;
      }
    });
    setColumnModelValues(updatedColumnModels, { isLoading: !hideSpinner });

    // we have to get the stack everytime because the filters might change.
    let action = LogActions.LOAD, stack = flowControl.current.getLogStack(aggModel.logStackNode);
    if (Array.isArray(aggModel.reloadCauses) && aggModel.reloadCauses.length > 0) {
      action = LogActions.RELOAD;
      stack = LogService.addCausesToStack(stack, aggModel.reloadCauses, aggModel.reloadStartTime);
    }
    const logObj = {
      action: flowControl.current.getLogAction(action, LogStackPaths.PSEUDO_COLUMN),
      stack,
    };
    activeListModel.column.getAggregatedValue(pageRef.current, logObj).then((values: any) => {
      if (flowControl.current.queue.counter !== current) {
        printDebugMessage(`getAggregatedValue success counter missmatch, old cnt=${current}`);
        return defer.resolve(false), defer.promise;
      }

      // remove the column error (they might retry)
      const errroIndexes: any = {};
      activeListModel.objects.forEach((obj: any) => {
        if (obj.column) {
          errroIndexes[obj.index] = true;
        }
      });
      setColumnModelValues(errroIndexes, { hasError: false });

      // use the returned value and:
      //  - update the templateVariables
      //  - update the aggregateResults
      //  - attach the values to the appropriate columnModel if we have all the data.
      const sourceDefinitions = referenceRef.current.table.sourceDefinitions;

      let newColValues: any = [];
      values.forEach((val: any, valIndex: number) => {
        // update the templateVariables
        if (activeListModel.objects.length > 0 && Array.isArray(sourceDefinitions.sourceMapping[activeListModel.column.name])) {
          // NOTE: not needed
          if (!Array.isArray(flowControl.current.templateVariables)) {
            flowControl.current.templateVariables = new Array(values.length);
          }

          if (!flowControl.current.templateVariables[valIndex]) {
            flowControl.current.templateVariables[valIndex] = {};
          }

          sourceDefinitions.sourceMapping[activeListModel.column.name].forEach((k: any) => {
            if (val.templateVariables.$self) {
              flowControl.current.templateVariables[valIndex][k] = val.templateVariables.$self;
            }
            if (val.templateVariables.$_self) {
              flowControl.current.templateVariables[valIndex][`_${k}`] = val.templateVariables.$_self;
            }
          });
        }

        // update the aggregateResults
        if (flowControl.current.aggregateResults[valIndex] === undefined) {
          flowControl.current.aggregateResults[valIndex] = {};
        }
        flowControl.current.aggregateResults[valIndex][activeListModel.column.name] = val;

        // attach the values to the appropriate objects
        attachPseudoColumnValue(activeListModel, valIndex, newColValues);
      });

      let indexes: any = {};
      setColValues(
        (prevColValues: any) => {
          return prevColValues.map((colVal: any, index: number) => {
            if (Array.isArray(newColValues[index])) {
              indexes[index] = true;
              return newColValues[index];
            }
            return colVal;
          })
        }
      );

      setColumnModelValues(indexes, { isLoading: false });

      // clear the causes
      aggModel.reloadCauses = [];
      aggModel.reloadStartTime = -1;

      return defer.resolve(true);
    }).catch((err: any) => {
      if (flowControl.current.queue.counter !== current) {
        return defer.resolve(false), defer.promise;
      }

      let errorIndexes: any = {};
      activeListModel.objects.forEach((obj: any) => {
        if (!obj.column) return;

        errorIndexes[obj.index] = true;
      });

      if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
        // show the timeout error in dependent models
        setColumnModelValues(errorIndexes, { isLoading: false, hasError: true });

        // mark this request as done
        return defer.resolve(true), defer.promise;
      } else {
        setColumnModelValues(errorIndexes, { isLoading: false });
      }

      defer.reject(err);
    });

    return defer.promise;
  }

  /**
       * @private
       * This function is called inside `_updateColumnAggregate`, after
       * the value is attached to the appropriate objects.
       * The purpose of this function is to show value of a column,
       * if all it's dependencies are available.
       * @param {Object} vm - the table model
       * @param {Object} activeListModel - the model that ermrestjs returns
       * @param {Integer} valIndex - the row index
       */
  const attachPseudoColumnValue = (activeListModel: any, valIndex: number, newColValues: any) => {
    activeListModel.objects.forEach((obj: any) => {
      // this is only called in recordset so it won't be any other type
      if (!obj.column) return;

      const model = columnModels[obj.index];

      // do we have all the waitfor results?
      const hasAll = model.column.waitFor.every((col: any) => {
        return col.isUnique || col.name in flowControl.current.aggregateResults[valIndex]
      });
      if (!(
        hasAll &&
        (model.column.name in flowControl.current.aggregateResults[valIndex] || model.column.isUnique)
      )) {
        return;
      }

      const displayValue = model.column.sourceFormatPresentation(
        flowControl.current.templateVariables[valIndex],
        flowControl.current.aggregateResults[valIndex][model.column.name],
        pageRef.current.tuples[valIndex],
      );

      if (!Array.isArray(newColValues[obj.index])) {
        newColValues[obj.index] = [];
      }
      newColValues[obj.index][valIndex] = displayValue;
    });
  };

  const registerFacetCallbacks = function (updateFacetStatesCallback: Function, updateFacetsCallback: Function) {
    flowControl.current.updateFacetsCallback = updateFacetsCallback;
    flowControl.current.updateFacetStatesCallback = updateFacetStatesCallback;
  };


  const providerValue = useMemo(() => {
    return {
      reference,
      isLoading,
      hasTimeoutError,
      totalRowCountHasTimeoutError,
      isInitialized,
      initialize,
      update,
      pageLimit,
      page,
      colValues,
      disabledRows,
      selectedRows,
      setSelectedRows,
      columnModels,
      totalRowCount,
      registerFacetCallbacks,
      printDebugMessage,
      checkReferenceURL,
      forceShowSpinner, setForceShowSpinner,
      // log related:
      logRecordsetClientAction, getLogAction, getLogStack,
      // used for manually calling the flow-control in record page
      updateMainEntity, fetchSecondaryRequests, addUpdateCauses,
      // the following values are not supposed to change
      // but needed by other components
      parentPageReference, parentPageTuple
    };
  }, [
    reference, isLoading, hasTimeoutError, totalRowCountHasTimeoutError,
    isInitialized, page, colValues,
    disabledRows, selectedRows, columnModels, totalRowCount
  ]);

  return (
    <RecordsetContext.Provider value={providerValue}>
      {children}
    </RecordsetContext.Provider>
  )
}
