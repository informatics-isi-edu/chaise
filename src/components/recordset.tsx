import '@chaise/assets/scss/_recordset.scss';

import React, { useEffect, useRef, useState } from 'react';
import { RecordsetFlowControl } from '@chaise/services/table';
import $log from '@chaise/services/logger';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import SearchInput from '@chaise/components/search-input';
import { LogActions, LogReloadCauses, LogStackPaths } from '@chaise/models/log';
import Title from '@chaise/components/title';
import Export from '@chaise/components/export';
import ChaiseSpinner from '@chaise/components/spinner';
import RecordSetTable from '@chaise/components/recordset-table';
import { attachContainerHeightSensors, attachMainContainerPaddingSensor, copyToClipboard } from '@chaise/utils/ui-utils';
import { LogService } from '@chaise/services/log';
import { SortColumn, RecordSetConfig, RecordSetDisplayMode } from '@chaise/models/recordset';
import { URL_PATH_LENGTH_LIMIT } from '@chaise/utils/constants';
import { ConfigService } from '@chaise/services/config';
import Q from 'q';
import TypeUtils from '@chaise/utils/type-utils';
import { createRedirectLinkFromPath, getRecordsetLink } from '@chaise/utils/uri-utils';
import { getColumnValuesFromPage, getRowValuesFromPage } from '@chaise/utils/data-utils';
import { windowRef } from '@chaise/utils/window-ref';
import Footer from '@chaise/components/footer';
import Faceting from '@chaise/components/faceting';
import TableHeader from '@chaise/components/table-header';
import useError from '@chaise/hooks/error';

export type RecordSetProps = {
  initialReference: any,
  config: RecordSetConfig,
  logInfo: {
    logObject?: any,
    logStack: any,
    logStackPath: string,
    logAppMode?: string
  },
  initialPageLimit?: number,
  getFavorites?: Function,
  getDisabledTuples?: Function,
};

const RecordSet = ({
  initialReference,
  config,
  logInfo,
  initialPageLimit,
  getFavorites,
  getDisabledTuples,
}: RecordSetProps): JSX.Element => {
  // $log.debug('recordset comp: render');

  const { dispatchError } = useError();

  const setStateVariable = (setFn: Function, cb: Function) => {
    const current = flowControl.current.queue.counter;
    $log.log('setColVals: ' + current);
    setFn(
      (prev: any) => {
        $log.log('setColVals: ' + flowControl.current.queue.counter);
        if (current !== flowControl.current.queue.counter) {
          $log.debug('HERE!!!!!!!!!!!!!!!!!!!!!!!! wrapper');
          return prev;
        }
        return cb(prev);
      }
    )
  }

  const [pageLimit, setPageLimit] = useState(typeof initialPageLimit === 'number' ? initialPageLimit : 25);

  const [reference, setReference] = useState<any>(initialReference);

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

  /**
   * whether the component has initialized or not
   */
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * whether the data has been loaded or not
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * the page of data that should be displayed
   */
  const [page, setPage] = useState<any>(null);

  const [colValues, setColValues] = useState<any>([]);

  const [disabledRows, setDisabledRows] = useState<any>([]);

  /**
   * whether the facet panel should be open or closed
   * NOTE: will return false if faceting is disabled
   * default value is based on reference.display.facetPanelOpen
   * and if it's not defined, it will be:
   * - true: in fullscreen mode
   * - false: in any other modes
   */
  const [facetPanelOpen, setFacetPanelOpen] = useState<boolean>(() => {
    if (config.disableFaceting) return false;

    let res = initialReference.display.facetPanelOpen;
    if (typeof res !== 'boolean') {
      res = config.displayMode === RecordSetDisplayMode.FULLSCREEN;
    }
    return res;
  });

  /**
   * We have to validate the facets first, and then we can show them.
   */
  const [facetColumnsReady, setFacetColumnsReady] = useState(false);

  // const [facetRefresh, setFacetReferesh] = useState(0);

  const flowControl = useRef(new RecordsetFlowControl(initialReference, logInfo));

  const mainContainer = useRef<any>(null);


  // initialize the recordset if it has not been done yet.
  useEffect(() => {
    if (isInitialized) {
      attachMainContainerPaddingSensor();
      return;
    }

    // TODO pass the proper values
    attachContainerHeightSensors();

    // capture and log the right click event on the permalink button
    const permalink = document.getElementById('permalink');
    if (permalink) {
      permalink.addEventListener('contextmenu', () => {
        LogService.logClientAction({
          action: flowControl.current.getTableLogAction(LogActions.PERMALINK_RIGHT),
          stack: flowControl.current.getTableLogStack()
        }, reference.defaultLogInfo);
      });
    }

    // if the faceting feature is disabled, then we don't need to generate facets
    if (config.disableFaceting) {
      initialize();
      return;
    }

    // NOTE this will affect the reference uri so it must be
    //      done before initializing recordset
    reference.generateFacetColumns().then((res: any) => {

      setFacetColumnsReady(true);

      // initialize the data
      initialize();

      /**
       * When there are issues in the given facet,
       * - recordset should just load the data based on the remaining
       *  facets that had no issue
       * - we should show an error and let users know that there were some
       *   issues.
       * - we should keep the browser location like original to allow users to
       *   refresh and try again. Also the issue might be happening because they
       *   are not logged in. So we should keep the location like original so after
       *   logging in they can get back to the page.
       * - Dismissing the error should change the browser location.
       */
      if (res.issues) {
        // TODO change the
        // var cb = function () {
        // updateLocation();
        // };
        // ErrorService.handleException(res.issues, false, false, cb, cb);
      } else {
        // TODO save query should just return a promise
      }

    }).catch((exception: any) => {
      $log.warn(exception);
      setIsLoading(false);
      if (TypeUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
        exception.errorData.redirectUrl = createRedirectLinkFromPath(exception.errorData.redirectPath);
      }
      dispatchError({ error: exception });
    });

  }, [isInitialized]);

  // call the flow-control after each reference object
  useEffect(() => {
    updatePage();
  }, [reference]);

  // after the main data has loaded, we can get the secondary data
  useEffect(() => {
    if (!isLoading) {
      updateLocation(config.displayMode.indexOf(RecordSetDisplayMode.RELATED) !== 0);
    }

    if (isInitialized && !isLoading && page && page.length > 0) {
      fetchSecondaryRequests(updatePage);
    }
  }, [isLoading, page]);

  //-------------------  flow-control functions:   --------------------//
  const scrollMainContainerToTop = () => {
    if (!mainContainer.current) return;

    mainContainer.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const updateLocation = (scrollToTop: boolean) => {
    // if we're showing an error popup, don't change the location
    // TODO
    // if ($rootScope.error) return;

    if (scrollToTop) {
      scrollMainContainerToTop();
    }
    windowRef.history.replaceState({}, '', getRecordsetLink(reference));
  }

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

    update(null, false, false, false, false);
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
  const update = (newRef: any, updateResult: boolean, updateCount: boolean, updateFacets: boolean, sameCounter: boolean, cause?: string) => {
    // eslint-disable-next-line max-len
    printDebugMessage(`update called with res=${updateResult}, cnt=${updateCount}, facets=${updateFacets}, sameCnt=${sameCounter}, cause=${cause}`);

    if (updateFacets) {
      // TODO
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
    } else {
      updatePage();
    }
  }

  const updatePage = () => {
    printDebugMessage('running update page');

    if (!flowControl.current.haveFreeSlot()) {
      return;
    }

    // TODO does this make sense? it's mutating the logStack
    LogService.updateStackFilterInfo(flowControl.current.getTableLogStack(), reference.filterLogInfo);

    // update the resultset
    updateMainEntity(updatePage, false);

    // TODO the rest
    // setFacetReferesh(facetRefresh+1);
  }

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
      printDebugMessage('break out of update main');
      return;
    }

    flowControl.current.queue.occupiedSlots++;
    flowControl.current.dirtyResult = false;

    (function (currentCounter) {
      $log.debug('counter', currentCounter, ': updating result');
      readMainEntity(hideSpinner, currentCounter).then((res: any) => {
        afterUpdateMainEntity(res, currentCounter);

        // TODO
        // self.tableError = false;
        $log.debug('counter', currentCounter, ': read is done. just before update page (to update the rest of the page)');
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
    if (res) {
      // we got the results, let's just update the url
      // scroll to top of the page so user can see the result
      // updateLocation(config.displayMode.indexOf(RecordSetDisplayMode.RELATED) !== 0);
    }
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
      const getTRS = config.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
        || config.displayMode === RecordSetDisplayMode.FULLSCREEN;

      // if it's in related entity section, we should fetch the
      // unlink trs (acl) of association tables
      const getUnlinkTRS = config.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
        && reference.derivedAssociationReference;

      const read = reference.read(pageLimit, logParams, false, false, getTRS, false, getUnlinkTRS);
      read.then((page: any) => {
        if (current !== flowControl.current.queue.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        $log.debug('counter', current, ': read main successful.');

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
        const tempVals = getColumnValuesFromPage(result.page);
        setStateVariable(setColValues, () => {
          return tempVals;
        });

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
        if (TypeUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
          err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
        }
        defer.reject(err);
      });

      // clear logObject since it was used just for the first request
      flowControl.current.logObject = {};
    }(counterer, flowControl.current.reloadCauses, flowControl.current.reloadStartTime));
    return defer.promise;
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
  }

  //-------------------  UI related functions:   --------------------//
  const checkReferenceURL = (ref: any) => {
    const ermrestPath = ref.isAttributeGroup ? ref.ermrestPath : ref.readPath;
    if (ermrestPath.length > URL_PATH_LENGTH_LIMIT || ref.uri.length > URL_PATH_LENGTH_LIMIT) {

      $log.warn('url length limit will be reached!');

      // TODO
      // show the alert (the function will handle just showing one alert)
      // AlertsService.addURLLimitAlert();

      // scroll to top of the container so users can see the alert
      scrollMainContainerToTop();

      // signal the caller that we reached the URL limit.
      return false;
    }

    // remove the alert if it's present since we don't need it anymore
    // AlertsService.deleteURLLimitAlert();
    return true;
  };

  const recordsetLink = getRecordsetLink();

  const copyPermalink = () => {
    LogService.logClientAction(
      {
        action: flowControl.current.getTableLogAction(LogActions.PERMALINK_LEFT),
        stack: flowControl.current.getTableLogStack()
      },
      reference.defaultLogInfo
    );

    copyToClipboard(recordsetLink);
  }

  /**
   * change the state of facet panel
   * @param value if given, it will force the state
   */
  const changeFacetPanelOpen = (value?: boolean) => {
    const val = typeof value === 'boolean' ? value : !facetPanelOpen;
    setFacetPanelOpen(val);
  };

  /**
   * Change the search term and trigger search
   * @param term string the search term
   * @param action string the log action
   */
  const changeSearch = (term: string | null, action: LogActions) => {
    $log.log(`search with term: ${term}, action : ${action}`);
    if (term) term = term.trim();

    const ref = reference.search(term); // this will clear previous search first
    if (checkReferenceURL(ref)) {
      // vm.lastActiveFacet = -1;
      $log.debug('counter', flowControl.current.queue.counter, ': new search term=' + term);

      // log the client action
      const extraInfo = typeof term === 'string' ? { 'search-str': term } : {};

      LogService.logClientAction({
        action: flowControl.current.getTableLogAction(action),
        stack: flowControl.current.getTableLogStack(null, extraInfo)
      }, ref.defaultLogInfo);

      update(ref, true, true, true, false, LogReloadCauses.SEARCH_BOX);
    }
  };

  const changeSort = (sortColumn: SortColumn) => {
    const ref = reference.sort([sortColumn]);
    if (checkReferenceURL(ref)) {

      $log.debug('counter', flowControl.current.queue.counter, ': change sort');

      LogService.logClientAction({
        action: flowControl.current.getTableLogAction(LogActions.SORT),
        stack: flowControl.current.getTableLogStack()
      }, ref.defaultLogInfo);

      update(ref, true, false, false, false, LogReloadCauses.SORT);
    }
  }

  const nextPreviousCallback = (isNext: boolean) => {
    const ref = isNext ? page.next : page.previous;
    const action = isNext ? LogActions.PAGE_NEXT : LogActions.PAGE_PREV;
    const cause = isNext ? LogReloadCauses.PAGE_NEXT : LogReloadCauses.PAGE_PREV;
    if (ref && checkReferenceURL(ref)) {

      printDebugMessage('request for previous page');

      LogService.logClientAction(
        {
          action: flowControl.current.getTableLogAction(action),
          stack: flowControl.current.getTableLogStack()
        },
        reference.defaultLogInfo
      );

      update(ref, true, false, false, false, cause);
    }
  }

  const panelClassName = facetPanelOpen ? 'open-panel' : 'close-panel';

  const renderSelectedRows = () => {
    return <></>
  };

  const renderSelectedFacetFilters = () => {
    return <></>
  }

  const renderShowFilterPanelBtn = () => {
    if (facetPanelOpen || !config.showFaceting || config.disableFaceting) {
      return;
    }
    return (
      <button className='show-filter-panel-btn chaise-btn chaise-btn-tertiary' onClick={() => changeFacetPanelOpen()}>
        <span className='chaise-btn-icon chaise-icon chaise-sidebar-open'></span>
        <span>Show filter panel</span>
      </button>
    )
  }

  return (
    <div className='recordset-container app-content-container'>
      {/* TODO what about $root.error and $root.showSpinner */}
      {
        isLoading &&
        <ChaiseSpinner />
      }
      <div className='top-panel-container'>
        <div className='top-flex-panel'>
          <div className={`top-left-panel ${panelClassName}`}>
            <div className='panel-header'>
              <div>
                <h3>Refine search</h3>
              </div>
              <div>
                <button
                  className='hide-filter-panel-btn chaise-btn chaise-btn-tertiary pull-right'
                  onClick={() => changeFacetPanelOpen()}
                >
                  <span className='chaise-btn-icon chaise-icon chaise-sidebar-close'></span>
                  <span>Hide panel</span>
                </button>
              </div>
            </div>
          </div>

          <div className='top-right-panel'>
            {config.displayMode === RecordSetDisplayMode.FULLSCREEN &&
              <div className='recordset-title-container title-container'>
                <div className='recordset-title-buttons title-buttons'>
                  <Export
                    reference={reference}
                    disabled={isLoading || !page || page.length === 0}
                  />
                  <OverlayTrigger placement='bottom' overlay={
                    <Tooltip>{MESSAGE_MAP.tooltip.permalink}</Tooltip>
                  }
                  >
                    <a
                      id='permalink'
                      className='chaise-btn chaise-btn-primary'
                      href={recordsetLink}
                      onClick={copyPermalink}
                    >
                      <span className='chaise-btn-icon fa-solid fa-bookmark' />
                      <span>Permalink</span>
                    </a>
                  </OverlayTrigger>
                  {/* <div ng-if='showSavedQueryUI && vm.savedQueryReference' className='chaise-btn-group' uib-dropdown>
                            <div tooltip-placement='top-right' uib-tooltip='{{tooltip.saveQuery}}'>
                                <button id='save-query' className='chaise-btn chaise-btn-primary dropdown-toggle' ng-disabled='disableSavedQueryButton()' ng-click='logSavedQueryDropdownOpened()' uib-dropdown-toggle ng-style='{'pointer-events': disableSavedQueryButton() ? 'none' : ''}'>
                                    <span className='chaise-btn-icon glyphicon glyphicon-floppy-save'></span>
                                    <span>Saved searches</span>
                                    <span className='caret '></span>
                                </button>
                            </div>
                            <ul className='dropdown-menu dropdown-menu-right' style='min-width:unset; top:20px;'>
                                <li>
                                    <a ng-click='::saveQuery()'>Save current search criteria</a>
                                    <a ng-click='::showSavedQueries()'>Show saved search criteria</a>
                                </li>
                            </ul>
                        </div> */}

                </div>
                <h1 id='page-title'>
                  <Title addLink={false} reference={initialReference} />
                  {/* TODO */}
                  {/* <small ng-if='vm.reference && vm.reference.location.version' className='h3-class' tooltip-placement='bottom-left' uib-tooltip='{{::tooltip.versionTime}} {{versionDate()}}'>({{versionDisplay()}})</small> */}
                  {/* <span ng-if='vm.reference.commentDisplay == 'inline' && vm.reference.comment' className='inline-tooltip'>{{vm.reference.comment}}</span> */}
                </h1>
              </div>
            }
            <div className='recordset-controls-container'>
              {renderSelectedRows()}
              <div className='row'>
                <div className='recordset-main-search col-lg-4 col-md-5 col-sm-6 col-xs-6'>
                  <SearchInput
                    initialSearchTerm={initialReference.location.searchTerm}
                    searchCallback={changeSearch}
                    inputClass={'main-search-input'}
                    searchColumns={initialReference.searchColumns}
                    disabled={false}
                    focus={true}
                  />
                </div>
              </div>
            </div>
            {renderSelectedFacetFilters()}
            {renderShowFilterPanelBtn()}
            <TableHeader />
          </div>

        </div>
      </div>
      <div className='bottom-panel-container'>
        {
          facetColumnsReady &&
          <div
            className={'side-panel-resizable ' + panelClassName}
            style={{visibility: config.showFaceting ? 'visible': 'hidden'}}
          >
            <div className='side-panel-container'>
              <Faceting
                // refresh={facetRefresh}
                reference={reference}
              />
            </div>
          </div>
        }
        <div className='main-container dynamic-padding' ref={mainContainer}>
          <div className='main-body'>
            <RecordSetTable
              page={page}
              colValues={colValues}
              columnModels={columnModels}
              config={config}
              sortCallback={changeSort}
              initialSortObject={initialReference.location.sortObject}
              nextPreviousCallback={nextPreviousCallback}
            />
          </div>
          {config.displayMode === RecordSetDisplayMode.FULLSCREEN && <Footer />}
        </div>
      </div>
    </div>
  )
};

export default RecordSet;

