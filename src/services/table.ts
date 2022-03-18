/* eslint max-classes-per-file: 0 */

import { LogActions, LogStackTypes } from '@chaise/models/log';
import { LogService } from '@chaise/services/log';
import MathUtils from '@chaise/utils/math-utils';
import TypeUtils from '@chaise/utils/type-utils';
import Q from 'q';
import { RecordSetDisplayMode } from '@chaise/models/recordset';
import { createRedirectLinkFromPath } from '@chaise/utils/uri-utils';
import { ConfigService } from '@chaise/services/config';
import $log from '@chaise/services/logger';
import { URL_PATH_LENGTH_LIMIT } from '@chaise/utils/constants';


class FlowControlDetails {
  maxRequests = 4;

  occupiedSlots = 0;

  counter = 0;

  constructor(maxRequests?: number) {
    if (maxRequests) {
      this.maxRequests = maxRequests;
    }
  }
}

export class RecordsetFlowControl {
  private _aggregateModels: any = [];
  private _reloadCauses: any;
  private _recountCauses: any;
  private _reloadStartTime: number;
  private _recountStartTime: number;
  flowControlDetails: FlowControlDetails;
  private _internalID: string;
  dirtyCount = false;
  dirtyResult = false;
  logStack: any;
  logStackPath: string;
  logObject: any;
  logAppMode: string | undefined;

  // for the aggregate values
  aggregateResults: any;

  templateVariables: any;

  disabledRows: any;

  getDisabledTuples?: Function;
  getFavorites?: Function;

  constructor(
    private reference: any,
    private pageLimit: number,
    private setIsLoading: Function,
    private page: any,
    private setPage: Function,
    private setIsInitialized: Function,
    logInfo: {
      logObject?: any,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
    private displayMode: RecordSetDisplayMode
  ) {

    if (this.reference.activeList) {
      this.reference.activeList.requests.forEach((activeListModel: any) => {
        // we cannot capture the whole stack object here since it might get updated
        const pcolStackNode = LogService.getStackNode(
          LogStackTypes.PSEUDO_COLUMN,
          activeListModel.column.table,
          {
            source: activeListModel.column.compressedDataSource,
            entity: activeListModel.column.isEntityMode,
            agg: activeListModel.column.aggregateFn
          },
        );
        this._aggregateModels.push({
          activeListModel, // the api that ermrestjs returns (has .objects and .column)
          processed: true, // whether we should get the data or not
          reloadCauses: [], // why the request is being sent to the server (might be empty)
          reloadStartTime: -1, // when the page became dirty
          logStackNode: pcolStackNode,
        });
      });
    }

    // log related
    this._reloadCauses = [];
    this._recountCauses = [];
    this._reloadStartTime = -1;
    this._recountStartTime = -1;

    // can be used to refer to this current instance of table
    this._internalID = MathUtils.uuid();

    this.flowControlDetails = new FlowControlDetails();

    this.logStack = logInfo.logStack;
    this.logStackPath = logInfo.logStackPath;
    this.logObject = logInfo.logObject;
    this.logAppMode = logInfo.logAppMode;
  }

  /**
   * returns true if we have free slots for requests.
   * @return {boolean}
   */
  private _haveFreeSlot() {
    const res = this.flowControlDetails.occupiedSlots < this.flowControlDetails.maxRequests;
    if (!res) {
      $log.debug('No free slot available.');
    }
    return res;
  }

  setReference(reference: any) {
    this.reference = reference;
  }

  setPageLimit(pageLimit: number) {
    this.pageLimit = pageLimit;
  }

  /**
   * This should be called to start the initialization of recordset page.
   * It will set the flags, and then call the actual update function.
   */
  initialize() {
    this.dirtyResult = true;
    this.dirtyCount = true;

    this.flowControlDetails.counter = 0;

    this.update(false, false, false, false);
  }

  /**
   * Based on the given inputs, it will set the state of different parts
   * of recordset directive to be updated.
   *
   * @param  {boolean} updateResult if it's true we will update the table.
   * @param  {boolean} updateCount  if it's true we will update the displayed total count.
   * @param  {boolean} updateFacets if it's true we will udpate the opened facets.
   * @param  {boolean} sameCounter if it's true, the flow-control counter won't be updated.
   * @param  {string?} cause why we're calling this function (optional)
   *
   * NOTE: sameCounter=true is used just to signal that we want to get results of the current
   * page status. For example when a facet opens or when users add a search term to a single facet.
   * we don't want to update the whole page in that case, just the facet itself.
   * If while doing so, the whole page updates, the updateFacet function itself should ignore the
   * stale request by looking at the request url.
   */
  update(updateResult: boolean, updateCount: boolean, updateFacets: boolean, sameCounter: boolean, cause?: string) {
    // eslint-disable-next-line max-len
    this.printDebugMessage(`update called with res=${updateResult}, cnt=${updateCount}, facets=${updateFacets}, sameCnt=${sameCounter}, cause=${cause}`);

    if (updateFacets) {
      // TODO
    }

    if (updateResult) {
      if (!Number.isInteger(this._reloadStartTime) || this._reloadStartTime === -1) {
        this._reloadStartTime = ConfigService.ERMrest.getElapsedTime();
      }
      if (cause && this._reloadCauses.indexOf(cause) === -1) {
        this._reloadCauses.push(cause);
      }
    }

    if (updateCount) {
      if (!Number.isInteger(this._recountStartTime) || this._recountStartTime === -1) {
        this._recountStartTime = ConfigService.ERMrest.getElapsedTime();
      }
      if (cause && this._recountCauses.indexOf(cause) === -1) {
        this._recountCauses.push(cause);
      }
    }

    // if it's true change, otherwise don't change.
    this.dirtyResult = updateResult || this.dirtyResult;
    // if the result is dirty, then we should get new data and we should
    // set the isLoading to true
    this.setIsLoading(this.dirtyResult);

    this.dirtyCount = updateCount || this.dirtyCount;

    if (!sameCounter) {
      this.flowControlDetails.counter++;
      $log.debug(`adding one to counter, new: ${this.flowControlDetails.counter}`);
    }
    // setTimeout(() => {
      RecordsetFlowControl._updatePage(this);
    // }, 5000);

  }

  /**
   * @private
   * This will be called after updateMainEntity. which will set the flags
   * based on success or failure of request.
   */
  private _afterUpdateMainEntity(res: boolean, counter: number) {
    if (res) {
      // we got the results, let's just update the url
      // TODO update the url
      // $rootScope.$emit('reference-modified');
    }
    this.flowControlDetails.occupiedSlots--;
    this.dirtyResult = !res;
    this.setIsLoading(false);

    // scroll to top of the page so user can see the result
    if (this.displayMode.indexOf(RecordSetDisplayMode.RELATED) !== 0) {
      // TODO scroll to top
      // scrollToTop();
    }

    $log.debug('counter', counter, `: after result update: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  private _readMainEntity(hideSpinner: boolean, counterer: number) {
    this.dirtyResult = false;
    this.setIsLoading(false);

    const defer = Q.defer();
    const logParams: any = this.logObject ? this.logObject : {};

    const hasCauses = Array.isArray(this._reloadCauses) && this._reloadCauses.length > 0;
    let act = hasCauses ? LogActions.RELOAD : LogActions.LOAD;

    // add reloadCauses
    if (hasCauses) {
      logParams.stack = LogService.addCausesToStack(this.getTableLogStack(), this.reloadCauses, this.reloadStartTime);
    } else {
      logParams.stack = this.getTableLogStack();
    }

    // create the action
    logParams.action = this.getTableLogAction(act);

    (function (self, current, requestCauses, reloadStartTime) {
      // the places that we want to show edit or delete button, we should also ask for trs
      // NOTE technically this should be based on passed config options but we're passing editable
      //      to mean both edit and create, so it's not really useful here
      const getTRS = self.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
        || self.displayMode === RecordSetDisplayMode.FULLSCREEN;

      // if it's in related entity section, we should fetch the
      // unlink trs (acl) of association tables
      const getUnlinkTRS = self.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
        && self.reference.derivedAssociationReference;

      const read = self.reference.read(self.pageLimit, logParams, false, false, getTRS, false, getUnlinkTRS);
      read.then((page: any) => {
        if (current !== self.flowControlDetails.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        $log.debug('counter', current, ': read main successful.');

        return self.getFavorites ? self.getFavorites(page) : { page };
      }).then((result: any) => {
        if (self.getDisabledTuples) {
          return self.getDisabledTuples(self, result.page, requestCauses, reloadStartTime);
        } else {
          return { page: result.page };
        }
      }).then((result: any) => {
        if (current !== self.flowControlDetails.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        self.page = result.page;
        self.setPage(self.page);

        // update the objects based on the new page
        if (Array.isArray(self.page.templateVariables)) {
          self.templateVariables = self.page.templateVariables.map((tv: any) => tv.values);
        } else {
          self.templateVariables = [];
        }
        self.aggregateResults = new Array(self.page.tuples.length);

        // if the getDisabledTuples was defined, this will have a value
        if (result.disabledRows) {
          self.disabledRows = result.disabledRows;
        }

        self.setIsInitialized(true);
        // globally sets when the app state is ready to interact with
        // TODO is this needed?
        // $rootScope.displayReady = true;

        // make sure we're getting the data for aggregate columns
        // TODO
        // self._aggregateModels.forEach((agg: any) => {
        //   if (self.page.tuples.length > 0) {
        //     agg.processed = false;
        //     agg.reloadCauses = requestCauses;
        //     if (!Number.isInteger(agg.reloadStartTime) || agg.reloadStartTime === -1) {
        //       agg.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
        //     }
        //   } else {
        //     agg.processed = true;

        //     // there are not matching rows, so there's no point in creating
        //     // aggregate requests.
        //     // make sure the spinner is hidden for the pending columns.
        //     agg.activeListModel.objects.forEach((obj: any) => {
        //       if (obj.column) {
        //         self.columnModels[obj.index].isLoading = false;
        //       }
        //     });
        //   }
        // });

        // empty the causes since now we're showing the value.
        self._reloadCauses = [];
        self._reloadStartTime = -1;

        defer.resolve(true);
      }).catch((err: any) => {
        if (current !== self.flowControlDetails.counter) {
          return defer.resolve(false);
        }

        self.setIsInitialized(true);
        // globally sets when the app state is ready to interact with
        // TODO is this needed?
        // $rootScope.displayReady = true;
        if (TypeUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
          err.errorData.redirectUrl = createRedirectLinkFromPath(err.errorData.redirectPath);
        }
        defer.reject(err);
      });

      // clear logObject since it was used just for the first request
      self.logObject = {};
    }(this, counterer, this._reloadCauses, this._reloadStartTime));
    return defer.promise;
  }

  /**
   * Given the tableModel object, will get the values for main entity and
   * attach them to the model.
   * @param  {object} vm           table model
   * @param  {function} updatePageCB The update page callback which we will call after getting the result.
   * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
   * @param  {object} isTerminal  Indicates whether we should show a terminal error or not for 400 QueryTimeoutError
   * @param {object} cb a callback that will be called after the read is done and is successful.
   */
  public updateMainEntity(updatePageCB: Function, hideSpinner: boolean, notTerminal?: boolean, cb?: Function) {
    if (!this.dirtyResult || !this._haveFreeSlot()) {
      $log.debug('counter', this.flowControlDetails.counter, ': break out of update main');
      return;
    }

    this.flowControlDetails.occupiedSlots++;
    this.dirtyResult = false;

    (function (self, currentCounter) {
      $log.debug('counter', currentCounter, ': updating result');
      self._readMainEntity(hideSpinner, currentCounter).then((res: any) => {
        self._afterUpdateMainEntity(res, currentCounter);

        // TODO
        // self.tableError = false;
        $log.debug('counter', currentCounter, ': read is done. just before update page (to update the rest of the page)');
        if (cb) cb(res);
        // TODO remember last successful main request
        // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
        updatePageCB();
      }).catch((err: any) => {
        self._afterUpdateMainEntity(true, currentCounter);
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
        // throw err;
        // }
      });
    }(this, this.flowControlDetails.counter));
  }

  private static _updatePage(vm: RecordsetFlowControl) {
    vm.printDebugMessage('running update page');

    if (!vm._haveFreeSlot()) {
      return;
    }

    LogService.updateStackFilterInfo(vm.getTableLogStack(), vm.reference.filterLogInfo);

    // update the resultset
    vm.updateMainEntity(RecordsetFlowControl._updatePage, false);

    // TODO the rest
  }

  /**
   * Return the action string that should be used for logs.
   * @param {Object} vm - the vm object
   * @param {String} actionPath - the ui context and verb
   * @param {String=} childStackPath - if we're getting the action for child (facet, pseudo-column)
   */
  getTableLogAction(actionPath: LogActions, childStackPath?: any) {
    let stackPath = this.logStackPath;
    if (childStackPath) {
      stackPath = LogService.getStackPath(stackPath, childStackPath);
    }
    const appMode = this.logAppMode ? this.logAppMode : undefined;
    return LogService.getActionString(actionPath, stackPath, appMode);
  }

  /**
   * Returns the stack object that should be used
   */
  getTableLogStack(childStackElement?: any, extraInfo?: any) {
    let stack = this.logStack;
    if (childStackElement) {
      stack = this.logStack.concat(childStackElement);
    }
    if (extraInfo) {
      return LogService.addExtraInfoToStack(stack, extraInfo);
    }
    return stack;
  }

  static checkReferenceURL(ref: any): boolean {
    const ermrestPath = ref.isAttributeGroup ? ref.ermrestPath : ref.readPath;
    if (ermrestPath.length > URL_PATH_LENGTH_LIMIT || ref.uri.length > URL_PATH_LENGTH_LIMIT) {

      $log.warn('url length limit will be reached!');

      // show the alert (the function will handle just showing one alert)
      // AlertsService.addURLLimitAlert();

      // scroll to top of the container so users can see the alert
      // scrollToTop();

      // signal the caller that we reached the URL limit.
      return false;
    }

    // remove the alert if it's present since we don't need it anymore
    // AlertsService.deleteURLLimitAlert();
    return true;
  }

  private printDebugMessage(message: string) {
    $log.debug(
      `counter ${this.flowControlDetails.counter}: ` +
      message
    );
  }

}
