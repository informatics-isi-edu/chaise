import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { LogActions, LogStackPaths } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordsetConfig, RecordsetDisplayMode } from '@isrd-isi-edu/chaise/src/models/recordset';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { RecordsetFlowControl } from '@isrd-isi-edu/chaise/src/services/table';
import { URL_PATH_LENGTH_LIMIT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getColumnValuesFromPage } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { createRedirectLinkFromPath } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import Q from 'q';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { NormalModule } from 'webpack';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';

// TODO more comments and proper types

export const RecordsetContext = createContext<{
  logRecordsetClientAction: (action: LogActions, childStackElement?: any, extraInfo?: any) => void,
  reference: any,
  isLoading: boolean,
  isInitialized: boolean,
  initialize: () => void,
  update: (newRef: any, limit: any, updateResult: boolean, updateCount: boolean, updateFacets: boolean, sameCounter: boolean, cause?: string) => boolean,
  pageLimit: any,
  page: any,
  colValues: any,
  columnModels: any,
  totalRowCount: number|null,
  registerFacetCallbacks: any, // TODO
  printDebugMessage: any // TODO
}
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  | null>(null);

type RecordsetProviderProps = {
  children: JSX.Element,
  initialReference: any,
  initialPageLimit: any,
  config: RecordsetConfig, // TODO
  logInfo: any, // TODO
  getFavorites?: Function,
  getDisabledTuples?: Function,
}

export default function RecordsetProvider({
  children,
  initialReference,
  initialPageLimit,
  config,
  logInfo,
  getFavorites,
  getDisabledTuples
}: RecordsetProviderProps): JSX.Element {
  const { dispatchError } = useError();
  const { addURLLimitAlert, removeURLLimitAlert } = useAlert();

  const [reference, setReference] = useState<any>(initialReference);
  /**
   * whether the component has initialized or not
   */
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLimit, setPageLimit] = useState(typeof initialPageLimit === 'number' ? initialPageLimit : 25);
  const [page, setPage] = useState<any>(null);
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
  const setColumnModelSpinners = (indexes: any, value: boolean) => {
    setColumnModels(
      (prevColumnModels: any) => {
        return prevColumnModels.map((cm: any, index: number) => {
          return (index in indexes) ? { ...cm, isLoading: value } : cm;
        });
      }
    )
  };

  const [totalRowCount, setTotalRowCount] = useState<number|null>(null);

  const [disabledRows, setDisabledRows] = useState<any>([]);

  const flowControl = useRef(new RecordsetFlowControl(initialReference, logInfo));

  // call the flow-control after each reference object
  useEffect(() => {
    updatePage();
  }, [pageLimit, reference]);

  // after the main data has loaded, we can get the secondary data
  useEffect(() => {
    if (!isLoading && page && page.length > 0) {
      fetchSecondaryRequests(updatePage);
    }
  }, [isLoading, page]);

  const logRecordsetClientAction = (action: LogActions, childStackElement?: any, extraInfo?: any) => {
    LogService.logClientAction({
      action: flowControl.current.getTableLogAction(action),
      stack: flowControl.current.getTableLogStack(childStackElement, extraInfo)
    }, reference.defaultLogInfo)
  };

  const checkReferenceURL = (ref: any) => {
    const ermrestPath = ref.isAttributeGroup ? ref.ermrestPath : ref.readPath;
    if (ermrestPath.length > URL_PATH_LENGTH_LIMIT || ref.uri.length > URL_PATH_LENGTH_LIMIT) {

      $log.warn('url length limit will be reached!');

      // show the alert (the function will handle just showing one alert)
      addURLLimitAlert();

      // TODO I should be able to pass the function from the comp to this provider
      // // scroll to top of the container so users can see the alert
      // scrollMainContainerToTop();

      // signal the caller that we reached the URL limit.
      return false;
    }

    // remove the alert if it's present since we don't need it anymore
    removeURLLimitAlert();
    return true;
  };

  const printDebugMessage = (message: string, counter?: number) => {
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

    update(null, null, false, false, false, false);
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
   * NOTE: we're passing newRef here to ensure the reference and flowControl object are updated together
   * NOTE: sameCounter=true is used just to signal that we want to get results of the current
   * page status. For example when a facet opens or when users add a search term to a single facet.
   * we don't want to update the whole page in that case, just the facet itself.
   * If while doing so, the whole page updates, the updateFacet function itself should ignore the
   * stale request by looking at the request url.
   */
  const update = (newRef: any, limit: number | null, updateResult: boolean, updateCount: boolean, updateFacets: boolean, sameCounter: boolean, cause?: string) => {
    // eslint-disable-next-line max-len
    printDebugMessage(`update called with res=${updateResult}, cnt=${updateCount}, facets=${updateFacets}, sameCnt=${sameCounter}, cause=${cause}`);

    if (newRef && !checkReferenceURL(newRef)) {
      return false;
    }

    if (updateFacets) {
      if (flowControl.current.updateFacetStatesCallback) {
        flowControl.current.updateFacetStatesCallback(cause);
      }
    }

    if (updateResult) {
      if (!Number.isInteger(flowControl.current.reloadStartTime) || flowControl.current.reloadStartTime === -1) {
        flowControl.current.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
      }
      if (cause && flowControl.current.reloadCauses.indexOf(cause) === -1) {
        flowControl.current.reloadCauses.push(cause);
      }
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
    // if the result is dirty, then we should get new data and we should
    // set the isLoading to true
    setIsLoading(flowControl.current.dirtyResult);

    flowControl.current.dirtyCount = updateCount || flowControl.current.dirtyCount;

    if (!sameCounter) {
      flowControl.current.queue.counter++;
      $log.debug(`adding one to counter, new: ${flowControl.current.queue.counter}`);
    }

    // updatePage is called as a result of updating the reference
    // we cannot ensure that the reference is latest, so we cannot call updatePage
    if (newRef) {
      // after react sets the reference, the useEffect will trigger updatePage
      setReference(newRef);
    } else if (limit && typeof limit === 'number') {
      setPageLimit(limit);
    } else {
      updatePage();
    }

    return true;
  };

  const updatePage = () => {
    printDebugMessage('running update page');

    if (!flowControl.current.haveFreeSlot()) {
      return;
    }

    // TODO does this make sense? it's mutating the logStack
    LogService.updateStackFilterInfo(flowControl.current.getTableLogStack(), reference.filterLogInfo);

    // update the resultset
    updateMainEntity(updatePage, false);

    // the aggregates are updated when the main entity request is done

    // do not fetch table count if hideRowCount is set in the annotation for the table
    // this is because the query takes too long sometimes
    if (!reference.display || !reference.display.hideRowCount) {
      // update the count
      updateTotalRowCount(updatePage);
    }

    // fetch the facets
    if (flowControl.current.updateFacetsCallback) {
      flowControl.current.updateFacetsCallback(flowControl, updatePage);
    }
  };

  /**
 * Given the tableModel object, will get the values for main entity and
 * attach them to the model.
 * @param  {function} updatePageCB The update page callback which we will call after getting the result.
 * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
 * @param  {object} isTerminal  Indicates whether we should show a terminal error or not for 400 QueryTimeoutError
 * @param {object} cb a callback that will be called after the read is done and is successful.
 */
  const updateMainEntity = (updatePageCB: Function, hideSpinner: boolean, notTerminal?: boolean, cb?: Function) => {
    if (!flowControl.current.dirtyResult || !flowControl.current.haveFreeSlot()) {
      return;
    }

    flowControl.current.queue.occupiedSlots++;
    flowControl.current.dirtyResult = false;

    (function (currentCounter) {
      printDebugMessage('updating result', currentCounter);
      readMainEntity(hideSpinner, currentCounter).then((res: any) => {
        afterUpdateMainEntity(res, currentCounter);

        // TODO
        // self.tableError = false;
        printDebugMessage('read is done. just before update page (to update the rest of the page)', currentCounter);
        if (cb) cb(res);
        // TODO remember last successful main request
        // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
        setTimeout(() => {
          updatePageCB();
        });
      }).catch((err: any) => {
        afterUpdateMainEntity(true, currentCounter);
        if (cb) cb(self, true);

        // TODO
        // show modal with different text if 400 Query Timeout Error
        // if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
        // clear the data shown in the table
        // self.setPage(null);
        // self.tableError = true;

        // if (!notTerminal) {
        //   err.subMessage = err.message;
        //   err.message = `The result set cannot be retrieved. Try the following to reduce the query time:\n${MESSAGE_MAP.queryTimeoutList}`;
        //   $log.warn(err);
        //   // TODO dispatch the error
        //   // ErrorService.handleException(err, true);
        // }
        // } else {
        // TODO dispatch the error
        dispatchError({ error: err });
        // }
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

    printDebugMessage(`after result update: ${res ? 'successful.' : 'unsuccessful.'}`, counter);
  }

  const readMainEntity = (hideSpinner: boolean, counterer: number) => {
    flowControl.current.dirtyResult = false;
    setIsLoading(true);

    const defer = Q.defer();
    const logParams: any = flowControl.current.logObject ? flowControl.current.logObject : {};

    const reloadCauses = flowControl.current.reloadCauses;
    const hasCauses = Array.isArray(reloadCauses) && reloadCauses.length > 0;
    const act = hasCauses ? LogActions.RELOAD : LogActions.LOAD;

    // add reloadCauses
    if (hasCauses) {
      logParams.stack = LogService.addCausesToStack(flowControl.current.getTableLogStack(), reloadCauses, flowControl.current.reloadStartTime);
    } else {
      logParams.stack = flowControl.current.getTableLogStack();
    }

    // create the action
    logParams.action = flowControl.current.getTableLogAction(act);

    (function (current, requestCauses, reloadStartTime) {
      // the places that we want to show edit or delete button, we should also ask for trs
      // NOTE technically this should be based on passed config options but we're passing editable
      //      to mean both edit and create, so it's not really useful here
      const getTRS = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0
        || config.displayMode === RecordsetDisplayMode.FULLSCREEN;

      // if it's in related entity section, we should fetch the
      // unlink trs (acl) of association tables
      const getUnlinkTRS = config.displayMode.indexOf(RecordsetDisplayMode.RELATED) === 0
        && reference.derivedAssociationReference;

      const read = reference.read(pageLimit, logParams, false, false, getTRS, false, getUnlinkTRS);
      read.then((page: any) => {
        if (current !== flowControl.current.queue.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        printDebugMessage('read main successful.', current);

        return getFavorites ? getFavorites(page) : { page };
      }).then((result: any) => {
        if (getDisabledTuples) {
          return getDisabledTuples(self, result.page, requestCauses, reloadStartTime);
        } else {
          return { page: result.page };
        }
      }).then((result: any) => {
        if (current !== flowControl.current.queue.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        setIsInitialized(true);
        setPage(result.page);
        // const tempVals = getColumnValuesFromPage(result.page);
        setColValues(getColumnValuesFromPage(result.page));
        // setStateVariable(setColValues, () => {
        //   return tempVals;
        // });

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

        // globally sets when the app state is ready to interact with
        // TODO is this needed?
        // $rootScope.displayReady = true;

        // make sure we're getting the data for aggregate columns
        // TODO
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
            let updatedColumnModels: any = {};
            agg.activeListModel.objects.forEach((obj: any) => {
              if (obj.column && columnModels[obj.index].isLoading) {
                updatedColumnModels[obj.index] = true;
              }
            });

            setColumnModelSpinners(updatedColumnModels, false);
          }
        });

        // empty the causes since now we're showing the value.
        flowControl.current.reloadCauses = [];
        flowControl.current.reloadStartTime = -1;

        defer.resolve(true);
      }).catch((err: any) => {
        if (current !== flowControl.current.queue.counter) {
          return defer.resolve(false);
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


  const updateTotalRowCount = (updatePageCB: Function) => {
    if (!flowControl.current.dirtyCount || !flowControl.current.haveFreeSlot()) {
      return;
    }

    flowControl.current.queue.occupiedSlots++;
    flowControl.current.dirtyCount = false;

    (function (curr) {
      fetchTotalRowCount(curr).then((res: any) => {
        afterUpdateTotalRowCount(res, curr);
        updatePageCB();
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
      aggList = [reference.aggregate.countAgg];
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
    let stack = flowControl.current.getTableLogStack();
    if (hasCauses) {
      stack = LogService.addCausesToStack(stack, flowControl.current.recountCauses, flowControl.current.recountStartTime);
    }
    reference.getAggregates(
      aggList,
      { action: flowControl.current.getTableLogAction(action), stack: stack }
    ).then(function getAggregateCount(response: any) {
      if (current !== flowControl.current.queue.counter) {
        defer.resolve(false);
        return defer.promise;
      }

      // TODO
      // vm.countError = false;
      setTotalRowCount(response[0]);


      flowControl.current.recountCauses = [];
      flowControl.current.recountStartTime = -1;

      defer.resolve(true);
    }).catch(function (err: any) {
      if (current !== flowControl.current.queue.counter) {
        defer.resolve(false);
        return defer.promise;
      }

      // TODO
      // if (err instanceof ERMrest.QueryTimeoutError) {
      //   // separate from hasError above
      //   vm.countError = true;
      // }

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
    printDebugMessage(`after update total row count: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  /**
   * get values for the secondary requests (aggregate columns, etc).
   * The updateMainEntity should be called on the tableModel before this function.
   * That function will generate `vm.page` which is needed for this function
   * @param  {function} updatePageCB The update page callback which we will call after getting each result.
   * @param  {boolean} hideSpinner?  Indicates whether we should show spinner for columns or not
   */
  const fetchSecondaryRequests = (updatePageCB: Function, hideSpinner?: boolean) => {
    if (isLoading) return;
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

        updatePageCB();
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
    let updatedColumnModels: any = {};
    activeListModel.objects.forEach((obj: any) => {
      // this is only called in recordset so it won't be related
      if (obj.column) {
        updatedColumnModels[obj.index] = true;
      }
    });
    setColumnModelSpinners(updatedColumnModels, !hideSpinner);

    // we have to get the stack everytime because the filters might change.
    let action = LogActions.LOAD, stack = flowControl.current.getTableLogStack(aggModel.logStackNode);
    if (Array.isArray(aggModel.reloadCauses) && aggModel.reloadCauses.length > 0) {
      action = LogActions.RELOAD;
      stack = LogService.addCausesToStack(stack, aggModel.reloadCauses, aggModel.reloadStartTime);
    }
    const logObj = {
      action: flowControl.current.getTableLogAction(action, LogStackPaths.PSEUDO_COLUMN),
      stack,
    };
    activeListModel.column.getAggregatedValue(page, logObj).then((values: any) => {
      if (flowControl.current.queue.counter !== current) {
        return defer.resolve(false), defer.promise;
      }

      // remove the column error (they might retry)
      // TODO
      // activeListModel.objects.forEach((obj: any) => {
      //   if (obj.column) {
      //     this.columnModels[obj.index].columnError = false;
      //   }
      // });

      // use the returned value and:
      //  - update the templateVariables
      //  - update the aggregateResults
      //  - attach the values to the appropriate columnModel if we have all the data.
      const sourceDefinitions = reference.table.sourceDefinitions;

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

      // TODO this is not working as expected because what's in the state
      // is outdated...
      setColumnModelSpinners(indexes, false);

      // clear the causes
      aggModel.reloadCauses = [];
      aggModel.reloadStartTime = -1;

      return defer.resolve(true);
    }).catch((err: any) => {
      if (flowControl.current.queue.counter !== current) {
        return defer.resolve(false), defer.promise;
      }

      // TODO
      // activeListModel.objects.forEach((obj: any) => {
      //   if (!obj.column) return;

      //   this.columnModels[obj.index].isLoading = false;

      //   // show the timeout error in dependent models
      //   if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
      //     // TODO what about inline and related ones that timed out?
      //     this.columnModels[obj.index].columnError = true;
      //     return defer.resolve(true), defer.promise;
      //   }
      // });

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
        page.tuples[valIndex],
      );

      if (!Array.isArray(newColValues[obj.index])) {
        newColValues[obj.index] = [];
      }
      newColValues[obj.index][valIndex] = displayValue;
    });
  };

  const registerFacetCallbacks = function (updateFacetStatesCallback: any, updateFacetsCallback: any) {
    flowControl.current.updateFacetsCallback = updateFacetsCallback;
    flowControl.current.updateFacetStatesCallback = updateFacetStatesCallback;
  };


  const providerValue = useMemo(() => {
    return {
      logRecordsetClientAction,
      reference,
      isLoading,
      isInitialized,
      initialize,
      update,
      pageLimit,
      page,
      colValues,
      columnModels,
      totalRowCount,
      registerFacetCallbacks,
      printDebugMessage,
      checkReferenceURL
    };
  }, [reference, isLoading, isInitialized, page, colValues, columnModels, totalRowCount]);

  return (
    <RecordsetContext.Provider value={providerValue}>
      {children}
    </RecordsetContext.Provider>
  )
}
