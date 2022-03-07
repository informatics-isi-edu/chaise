/* eslint max-classes-per-file: 0 */

import { Displayname } from '@chaise/models/displayname';
import { LogActions, LogStackPaths, LogStackTypes } from '@chaise/models/log';
import { LogService } from '@chaise/services/log';
import MathUtils from '@chaise/utils/math-utils';
import TypeUtils from '@chaise/utils/type-utils';
import Q from 'q';
import { getRowValuesFromPage } from '../utils/data-utils';
import { MESSAGE_MAP } from '../utils/message-map';
import { createRedirectLinkFromPath } from '../utils/uri-utils';
import { ConfigService } from './config';
import $log from './logger';

export enum RecordsetSelectMode {
  NO_SELECT,
  SINGLE_SELECT,
  MULTI_SELECT
}

export enum RecordSetDisplayMode {
  FULLSCREEN = 'fullscreen',
  TABLE = 'table',
  RELATED = 'related',
  INLINE = 'related/inline',
  POPUP = 'popup',
  FK_POPUP = 'popup/foreignkey',
  FK_POPUP_CREATE = 'popup/foreignkey/create',
  FK_POPUP_EDIT = 'popup/foreignkey/edit',
  PURE_BINARY_POPUP_ADD = 'popup/purebinary/add',
  PURE_BINARY_POPUP_UNLINK = 'popup/facet',
  SAVED_QUERY_POPUP = 'popup/savedquery'
}

// const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
// const MAX_CONCURENT_REQUEST = 4;
// const URL_PATH_LENGTH_LIMIT = (isIEOrEdge) ? 2000 : 4000;
// const FACET_PAGE_SIZE = 10;
// const AUTO_SEARCH_TIMEOUT = 2000;
const CELL_LIMIT = 500;

class FlowControlObject {
  maxRequests = 4;

  occupiedSlots = 0;

  counter = 0;

  constructor(maxRequests?: number) {
    if (maxRequests) {
      this.maxRequests = maxRequests;
    }
  }
}

export class RecordsetViewModel {
  readyToInitialize = true; // TODO needed?

  initialized = false;

  hasLoaded = false;

  reference: any;

  displayname: Displayname;

  comment?: string;

  // sortby:             reference.location.sortObject ? reference.location.sortObject[0].column: null; not needed
  // sortOrder:          reference.location.sortObject ? (reference.location.sortObject[0].descending ? "desc" : "asc") : null; not needed
  enableSort = true;

  pageLimit = 25;

  rowValues: any; // array of objects

  selectedRows: any; // array of objects

  disabledRows: any;

  // matchNotNull:       params.matchNotNull; deprecated and not needed
  // matchNull:          params.matchNull; deprecated and not needed
  // search:             reference.location.searchTerm; not needed
  config = {
    viewable: true,
    deletable: true,
    editable: true,
    selectMode: RecordsetSelectMode.NO_SELECT,
    showFaceting: true,
    facetPanelOpen: true,
    // showNull:           params.showNull === true;
    // hideNotNullChoice:  params.hideNotNullChoice;
    // hideNullChoice:     params.hideNullChoice;
    displayMode: RecordSetDisplayMode.FULLSCREEN,
    enableFavorites: false,
  };

  getDisabledTuples?: Function;

  getFavorites?: Function;

  // log related attributes
  logObject?: any;

  logStack: any;

  logStackPath: string;

  logAppMode?: string;

  // used for the recordset height and sticky section logic
  // TODO different modals should pass different strings (ultimatly it should be the element and not selector)
  parentContainerSelector?: string;

  parentStickyAreaSelector?: string;

  columns: any;

  columnModels: any;

  aggregateModels: any;

  page: any;

  facetModels: any;

  lastActiveFacet = -1;

  // for the aggregate values
  aggregateResults: any;

  templateVariables: any;

  // for the logic of showing result overtime
  pendingRowValues: any;

  pushMoreRowsPending: any;

  private _pushMoreID: string | null = null;

  sortby: any;

  sortOrder: any;

  // search term
  search: string | null;

  // the count that should be displayed
  totalRowsCnt: number | null = null;

  // TODO why?
  internalID: string;

  private reloadCauses : string[] = [];

  private _recountCauses : string[] = [];

  private reloadStartTime = -1;

  private _recountStartTime = -1;

  private flowControlObject: FlowControlObject;

  // flow control
  dirtyResult = false;

  dirtyCount = false;

  // whether we should show the timeout error for main table
  tableError = false;

  // whether we should the timeout error for count
  countError = false;

  // used for displayname logic
  // parentReference: any,
  // parentTuple?: any

  constructor(
    reference: any,
    pageLimit: number,
    config: any,
    logInfo: {
      logObject?: any,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
    displayname?: Displayname,
  ) {
    this.reference = reference;
    this.pageLimit = pageLimit;

    this.columns = reference.columns;

    this.search = reference.location.searchTerm;

    this.displayname = displayname || reference.displayname;

    this.config = config;

    this.columnModels = [];
    this.reference.columns.forEach((col: any) => {
      this.columnModels.push({
        column: col,
        isLoading: col.hasWaitFor === true || col.isUnique === false,
      });
    });

    this.aggregateModels = [];
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
        this.aggregateModels.push({
          activeListModel, // the api that ermrestjs returns (has .objects and .column)
          processed: true, // whether we should get the data or not
          reloadCauses: [], // why the request is being sent to the server (might be empty)
          reloadStartTime: -1, // when the page became dirty
          logStackNode: pcolStackNode,
        });
      });
    }

    // only allowing single column sort here
    const location = this.reference.location;
    if (location.sortObject) {
      this.sortby = location.sortObject[0].column;
      this.sortOrder = (location.sortObject[0].descending ? 'desc' : 'asc');
    }

    // log related
    this.reloadCauses = [];
    this._recountCauses = [];
    this.reloadStartTime = -1;
    this._recountStartTime = -1;

    this.logStack = logInfo.logStack;
    this.logStackPath = logInfo.logStackPath;

    // can be used to refer to this current instance of table
    this.internalID = MathUtils.uuid();

    this.flowControlObject = new FlowControlObject();
  }

  /**
   * returns true if we have free slots for requests.
   * @return {boolean}
   */
  private _haveFreeSlot() {
    const res = this.flowControlObject.occupiedSlots < this.flowControlObject.maxRequests;
    if (!res) {
      $log.debug('No free slot available.');
    }
    return res;
  }

  /**
   * get values for the aggregate columns.
   * The updateMainEntity should be called on the tableModel before this function.
   * That function will generate `vm.page` which is needed for this function
   * @param  {object} vm           table model
   * @param  {function} updatePageCB The update page callback which we will call after getting each result.
   * @param  {object} logObject    The object that should be logged with the read request.
   * @param  {boolean} hideSpinner  Indicates whether we should show spinner for columns or not
   */
  updateColumnAggregates(updatePageCB: Function, hideSpinner?: boolean) {
    if (!this.hasLoaded) return;
    this.aggregateModels.forEach((aggModel: any, index: number) => {
      if (!this._haveFreeSlot() || aggModel.processed) {
        return;
      }

      this.flowControlObject.occupiedSlots++;

      aggModel.processed = true;

      $log.debug('counter', this.flowControlObject.counter, `: getting aggregated values for column (index=${index})`);
      this._updateColumnAggregate(aggModel, this.flowControlObject.counter, hideSpinner).then((res: any) => {
        this.flowControlObject.occupiedSlots--;
        aggModel.processed = res;

        $log.debug('counter', this.flowControlObject.counter, `: after aggregated value for column (index=${index}) update: ${res ? 'successful.' : 'unsuccessful.'}`);

        updatePageCB(this);
      }).catch((err: any) => {
        // TODO should it throw?
        throw err;
      });
    });
  }

  /**
   * @private
   * Generate request for each individual aggregate columns. Will return
   * a promise that is resolved with a boolean value denoting the success or failure.
   * A rejected promise should be displayed as an error.
   */
  private _updateColumnAggregate(aggModel: any, current: number, hideSpinner?: boolean) {
    const defer = Q.defer(),
          activeListModel = aggModel.activeListModel;

    // show spinner for all the dependent columns
    activeListModel.objects.forEach((obj: any) => {
      // this is only called in recordset so it won't be related
      if (obj.column) {
        this.columnModels[obj.index].isLoading = !hideSpinner;
      }
    });

    // we have to get the stack everytime because the filters might change.
    let action = LogActions.LOAD, stack = this.getTableLogStack(aggModel.logStackNode);
    if (Array.isArray(aggModel.reloadCauses) && aggModel.reloadCauses.length > 0) {
      action = LogActions.RELOAD;
      stack = LogService.addCausesToStack(stack, aggModel.reloadCauses, aggModel.reloadStartTime);
    }
    const logObj = {
      action: this.getTableLogAction(action, LogStackPaths.PSEUDO_COLUMN),
      stack,
    };
    activeListModel.column.getAggregatedValue(this.page, logObj).then((values: any) => {
      if (this.flowControlObject.counter !== current) {
        return defer.resolve(false), defer.promise;
      }

      // remove the column error (they might retry)
      activeListModel.objects.forEach((obj: any) => {
        if (obj.column) {
          this.columnModels[obj.index].columnError = false;
        }
      });

      // use the returned value and:
      //  - update the templateVariables
      //  - update the aggregateResults
      //  - attach the values to the appropriate columnModel if we have all the data.
      const sourceDefinitions = this.reference.table.sourceDefinitions;
      values.forEach((val: any, valIndex: number) => {
        // update the templateVariables
        if (activeListModel.objects.length > 0 && Array.isArray(sourceDefinitions.sourceMapping[activeListModel.column.name])) {
          // NOTE: not needed
          if (!Array.isArray(this.templateVariables)) {
            this.templateVariables = new Array(values.length);
          }

          if (!this.templateVariables[valIndex]) {
            this.templateVariables[valIndex] = {};
          }

          sourceDefinitions.sourceMapping[activeListModel.column.name].forEach((k: any) => {
            if (val.templateVariables.$self) {
              this.templateVariables[valIndex][k] = val.templateVariables.$self;
            }
            if (val.templateVariables.$_self) {
              this.templateVariables[valIndex][`_${k}`] = val.templateVariables.$_self;
            }
          });
        }

        // update the aggregateResults
        if (this.aggregateResults[valIndex] === undefined) {
          this.aggregateResults[valIndex] = {};
        }
        this.aggregateResults[valIndex][activeListModel.column.name] = val;

        // attach the values to the appropriate objects
        this._attachPseudoColumnValue(activeListModel, valIndex);
      });

      // clear the causes
      aggModel.reloadCauses = [];
      aggModel.reloadStartTime = -1;

      return defer.resolve(true);
    }).catch((err: any) => {
      if (this.flowControlObject.counter !== current) {
        return defer.resolve(false), defer.promise;
      }

      activeListModel.objects.forEach((obj: any) => {
        if (!obj.column) return;

        this.columnModels[obj.index].isLoading = false;

        // show the timeout error in dependent models
        if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
          // TODO what about inline and related ones that timed out?
          this.columnModels[obj.index].columnError = true;
          return defer.resolve(true), defer.promise;
        }
      });

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
  private _attachPseudoColumnValue(activeListModel: any, valIndex: number) {
    activeListModel.objects.forEach((obj: any) => {
    // this is only called in recordset so it won't be any other type
      if (!obj.column) return;

      const model = this.columnModels[obj.index];

      // do we have all the waitfor results?
      const hasAll = model.column.waitFor.every((col: any) => col.isUnique || col.name in this.aggregateResults[valIndex]);
      if (!(hasAll && (model.column.name in this.aggregateResults[valIndex] || model.column.isUnique))) return;

      const displayValue = model.column.sourceFormatPresentation(
        this.templateVariables[valIndex],
        this.aggregateResults[valIndex][model.column.name],
        this.page.tuples[valIndex],
      );

      model.isLoading = false;

      // if rowValues has not been completely populated yet, use pendingRowValues instead
      if (this.pushMoreRowsPending) {
        if (this.pendingRowValues[valIndex] === undefined) {
          this.pendingRowValues[valIndex] = {};
        }
        this.pendingRowValues[valIndex][obj.index] = displayValue;
      } else {
        this.rowValues[valIndex][obj.index] = displayValue;
      // emit aggregates loaded event for [row][column]
      // TODO how to signal that the aggregate is loaded
      // $rootScope.$emit("aggregate-loaded-" + vm.internalID + "-" + valIndex, obj.index);
      }
    });
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
      $log.debug('counter', this.flowControlObject.counter, ': break out of update main');
      return;
    }

    this.flowControlObject.occupiedSlots++;
    this.dirtyResult = false;

    (function (self, currentCounter) {
      $log.debug('counter', currentCounter, ': updating result');
      self._readMainEntity(hideSpinner, currentCounter).then((res: any) => {
        self._afterUpdateMainEntity(res, currentCounter);
        self.tableError = false;
        $log.debug('counter', currentCounter, ': read is done. just before update page (to update the rest of the page)');
        if (cb) cb(res);
        // TODO remember last successful main request
        // when a request fails for 400 QueryTimeout, revert (change browser location) to this previous request
        updatePageCB();
      }).catch((err) => {
        self._afterUpdateMainEntity(true, currentCounter);
        if (cb) cb(self, true);

        // show modal with different text if 400 Query Timeout Error
        if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
          // clear the data shown in the table
          self.rowValues = [];
          self.tableError = true;

          if (!notTerminal) {
            err.subMessage = err.message;
            err.message = `The result set cannot be retrieved. Try the following to reduce the query time:\n${MESSAGE_MAP.queryTimeoutList}`;
            $log.warn(err);
            // TODO dispatch the error
            // ErrorService.handleException(err, true);
          }
        } else {
          // TODO dispatch the error
          throw err;
        }
      });
    }(this, this.flowControlObject.counter));
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
    this.flowControlObject.occupiedSlots--;
    this.dirtyResult = !res;
    this.hasLoaded = true;

    // scroll to top of the page so user can see the result
    if (this.config.displayMode.indexOf(RecordSetDisplayMode.RELATED) !== 0) {
      // TODO scroll to top
      // scrollToTop();
    }

    $log.debug('counter', counter, `: after result update: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  /**
   * @private
   * After the push more row logic is done, merge the pendingRowValues with rowValues
   * pendingRowValues will be populated by:
   * - afterReadAggregate function if it's called while push more row logic has not finished
   */
  private _mergeRowValuesAfterPushMoreRows() {
    if (this.pendingRowValues) {
      for (const rowIndex in this.pendingRowValues) {
        for (const colIndex in this.pendingRowValues[rowIndex]) {
          this.rowValues[rowIndex][colIndex] = this.pendingRowValues[rowIndex][colIndex];
          // emit aggregates loaded event for [row][column] after push more rows

          // TODO aggregate loaded
          // $rootScope.$emit("aggregate-loaded-" + this.internalID + "-" + rowIndex, colIndex);
        }
      }
    }
    this.pendingRowValues = {};
  }

  // comment $timeout why
  private pushMoreTimeout : any = null;

  /**
   * @private
   * Does the actual read for the main entity. Returns a promise that will
   * be resolved with `true` if the request was successful.
   */
  private _readMainEntity(hideSpinner: boolean, counterer: number) {
    // cancel timeout loop that may still be running and hide the spinner and "Loading ..."
    clearTimeout(this.pushMoreTimeout);
    this.pushMoreRowsPending = false;
    this.dirtyResult = false;
    this.hasLoaded = false;
    const defer = Q.defer();

    const logParams : any = this.logObject ? this.logObject : {};

    const hasCauses = Array.isArray(this.reloadCauses) && this.reloadCauses.length > 0;
    let act = hasCauses ? LogActions.RELOAD : LogActions.LOAD;

    // if getDisabledTuples exists, then this read will load everything (domain values) and the
    // getDisabledTuples is the actual load/reload
    if (this.getDisabledTuples) {
      act = hasCauses ? LogActions.RELOAD_DOMAIN : LogActions.LOAD_DOMAIN;
    }

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
      const getTRS = self.config.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
                   || self.config.displayMode === RecordSetDisplayMode.FULLSCREEN;

      // if it's in related entity section, we should fetch the
      // unlink trs (acl) of association tables
      const getUnlinkTRS = self.config.displayMode.indexOf(RecordSetDisplayMode.RELATED) === 0
                         && self.reference.derivedAssociationReference;

      self.reference.read(self.pageLimit, logParams, false, false, getTRS, false, getUnlinkTRS).then((page: any) => {
        if (current !== self.flowControlObject.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        $log.debug('counter', current, ': read main successful.');

        return self.getFavorites ? self.getFavorites(page) : { page };
      }).then((result: any) => (self.getDisabledTuples ? self.getDisabledTuples(self, result.page, requestCauses, reloadStartTime) : { page: result.page })).then((result: any) => {
        if (current !== self.flowControlObject.counter) {
          defer.resolve(false);
          return defer.promise;
        }

        /*
        * The following line used to be part of the previous step of promise chain,
        * but I moved it here to remove the UI bugs that it was causing.
        * since we're showing the rows using ng-repeat on vm.rowValues, the number of
        * displayed rows won't change until that value changes. But if we change the
        * vm.page before this, then the passed tuple to the ellipsis directive would change.
        * So if we were changing vm.page in one digest cycle, and vm.rowValues in the other,
        * then the displayed row would be based on the old vm.rowValues but the new vm.page.
        */
        // attach the new page
        self.page = result.page;

        // update the objects based on the new page
        if (Array.isArray(self.page.templateVariables)) {
          self.templateVariables = self.page.templateVariables.map((tv: any) => tv.values);
        } else {
          self.templateVariables = [];
        }
        self.aggregateResults = new Array(self.page.tuples.length);
        self.pendingRowValues = {};

        // if the getDisabledTuples was defined, this will have a value
        if (result.disabledRows) {
          self.disabledRows = result.disabledRows;
        }

        const rowValues = getRowValuesFromPage(self.page);
        // calculate how many rows can be shown based on # of columns
        const rowLimit = Math.ceil(CELL_LIMIT / self.page.reference.columns.length);

        // recursive function for adding more rows to the DOM
        function _pushMoreRows(self: RecordsetViewModel, prevInd: number, limit: number, pushMoreID: string) {
          if (self._pushMoreID === pushMoreID) {
            const nextLimit = prevInd + limit;
            // combines all of the second array (rowValues) with the first one (vm.rowValues)
            Array.prototype.push.apply(self.rowValues, rowValues.slice(prevInd, nextLimit));
            if (rowValues[nextLimit]) {
              $log.debug('counter', current, ': recurse with', self.rowValues.length);
              setTimeout(() => {
                if (self._pushMoreID === pushMoreID) {
                  _pushMoreRows(self, nextLimit, limit, pushMoreID);
                } else {
                  $log.debug('current global counter: ', self.flowControlObject.counter);
                  $log.debug('counter', current, ': break out of timeout inside push more rows');
                  $log.debug('counter', current, ': with uuid', pushMoreID);
                  $log.debug('counter', current, ': with global uuid', self._pushMoreID);
                  self.pushMoreRowsPending = false;
                }
              });
            } else {
              // we reached the end of the data to page in
              self.pushMoreRowsPending = false;
              self._mergeRowValuesAfterPushMoreRows();
            }
          } else {
            $log.debug('current global counter: ', self.flowControlObject.counter);
            $log.debug('counter', current, ': break out of push more rows');
            $log.debug('counter', current, ': with uuid', pushMoreID);
            $log.debug('counter', current, ': with global uuid', self._pushMoreID);
            self.pushMoreRowsPending = false;
            self._mergeRowValuesAfterPushMoreRows();
          }
        }

        $log.debug('counter', current, ': row values length ', rowValues.length);
        self.rowValues = [];
        if (rowValues.length > rowLimit) {
          self.pushMoreRowsPending = true;
          const uniqueIdentifier = self._pushMoreID = MathUtils.uuid();
          $log.debug('counter', current, ': before push more rows with uuid', uniqueIdentifier);
          _pushMoreRows(self, 0, rowLimit, uniqueIdentifier);
        } else {
          self.rowValues = rowValues;
        }

        self.initialized = true;
        // globally sets when the app state is ready to interact with
        // TODO is this needed?
        // $rootScope.displayReady = true;

        // make sure we're getting the data for aggregate columns
        self.aggregateModels.forEach((agg: any) => {
          if (self.page.tuples.length > 0) {
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
            agg.activeListModel.objects.forEach((obj: any) => {
              if (obj.column) {
                self.columnModels[obj.index].isLoading = false;
              }
            });
          }
        });

        // empty the causes since now we're showing the value.
        self.reloadCauses = [];
        self.reloadStartTime = -1;

        defer.resolve(true);
      })
        .catch((err: any) => {
          if (current !== self.flowControlObject.counter) {
            return defer.resolve(false);
          }

          self.initialized = true;
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
    }(this, counterer, this.reloadCauses, this.reloadStartTime));
    return defer.promise;
  }

  // /**
  //  * @private
  //  * will be called after getting data for each facet to set the flags.
  //  */
  // function _afterFacetUpdate(vm, i, res) {
  //   vm.flowControlObject.occupiedSlots--;
  //   var currFm = vm.facetModels[i];
  //   currFm.initialized = res || currFm.initialized;
  //   currFm.isLoading = !res;
  //   currFm.processed = res || currFm.processed;

  //   $log.debug("counter", vm.flowControlObject.counter, ": after facet (index=" + i + ") update: " + (res ? "successful." : "unsuccessful."));
  // }

  /**
   * @private
   * Calls _getMainRowsCount to update the count. won't return any values
   */
  _updateMainCount(updatePageCB: Function) {
    if (!this.dirtyCount || !this._haveFreeSlot()) {
      $log.debug('counter', this.flowControlObject.counter, ': break out of updateCount: (not dirty or full)');
      return;
    }

    this.flowControlObject.occupiedSlots++;
    this.dirtyCount = false;

    (function (self, curr) {
      self._getMainRowsCount(curr).then((res: boolean) => {
        self._afterGetMainRowsCount(res, curr);
        updatePageCB(self);
      }).catch((err: any) => {
        self._afterGetMainRowsCount(true, curr);
        throw err;
      });
    }(this, this.flowControlObject.counter));
  }

  /**
   * @private
   * This will generate the request for getting the count.
   * Returns a promise. If it's resolved with `true` then it has been successful.
   */
  _getMainRowsCount(current: number) : Q.Promise<boolean> {
    $log.debug('counter', current, ': getRowsCount.');
    const defer = Q.defer();
    const promise = defer.promise as Q.Promise<boolean>;
    let aggList, hasError;
    try {
      // if the table doesn't have any simple key, this might throw error
      aggList = [this.reference.aggregate.countAgg];
    } catch (exp) {
      hasError = true;
    }
    if (hasError) {
      this.totalRowsCnt = null;
      defer.resolve(true);
      return promise;
    }

    const hasCauses = Array.isArray(this._recountCauses) && this._recountCauses.length > 0;
    const action = hasCauses ? LogActions.RECOUNT : LogActions.COUNT;
    let stack = this.getTableLogStack();
    if (hasCauses) {
      stack = LogService.addCausesToStack(stack, this._recountCauses, this._recountStartTime);
    }
    this.reference.getAggregates(
      aggList,
      { action: this.getTableLogAction(action), stack },
    ).then((response: any) => {
      if (current !== this.flowControlObject.counter) {
        defer.resolve(false);
        return promise;
      }

      this.countError = false;

      this.totalRowsCnt = response[0];

      this._recountCauses = [];
      this._recountStartTime = -1;

      defer.resolve(true);
    }).catch((err: any) => {
      if (current !== this.flowControlObject.counter) {
        defer.resolve(false);
        return promise;
      }

      if (err instanceof ConfigService.ERMrest.QueryTimeoutError) {
        // separate from hasError above
        this.countError = true;
      }

      // fail silently
      this.totalRowsCnt = null;
      return defer.resolve(true), defer.promise;
    });

    return promise;
  }

  /**
   * @private
   * will be called after getting data for count to set the flags.
   */
  private _afterGetMainRowsCount(res: boolean, current: number) {
    this.flowControlObject.occupiedSlots--;
    this.dirtyCount = !res;
    $log.debug('counter', current, `: after _getMainRowsCount: ${res ? 'successful.' : 'unsuccessful.'}`);
  }

  /**
   * This should be called to start the initialization of recordset page.
   * It will set the flags, and then call the actual update function.
   * @param  {object} vm the table model object
   */
  initialize() {
    this.initialized = false;
    this.dirtyResult = true;
    this.dirtyCount = true;
    this.flowControlObject.counter = 0;

    this.update(false, false, false, false);
  }

  /**
   * Based on the given inputs, it will set the state of different parts
   * of recordset directive to be updated.
   *
   * @param  {Object} vm           table view model
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
    $log.debug('counter', this.flowControlObject.counter, `update called with res=${updateResult}, cnt=${updateCount}, facets=${updateFacets}, sameCnt=${sameCounter}, cause=${cause}`);

    if (updateFacets) {
      this.facetModels.forEach((fm: any, index: number) => {
        if (this.lastActiveFacet === index) {
          return;
        }

        if (fm.isOpen) {
          if (!Number.isInteger(fm.reloadStartTime) || fm.reloadStartTime === -1) {
            fm.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
          }
          if (cause && fm.reloadCauses.indexOf(cause) === -1) {
            fm.reloadCauses.push(cause);
          }

          fm.processed = false;
          fm.isLoading = true;
        } else {
          fm.initialized = false;
          fm.processed = true;
        }
      });
    }

    if (updateResult) {
      if (!Number.isInteger(this.reloadStartTime) || this.reloadStartTime === -1) {
        this.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
      }
      if (cause && this.reloadCauses.indexOf(cause) === -1) {
        this.reloadCauses.push(cause);
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
    // set the hasLoaded to false.
    this.hasLoaded = !this.dirtyResult;

    this.dirtyCount = updateCount || this.dirtyCount;

    setTimeout(() => {
      if (!sameCounter) {
        this.flowControlObject.counter++;
        $log.debug(`adding one to counter, new: ${this.flowControlObject.counter}`);
      }
      RecordsetViewModel._updatePage(this);
    }, 0);
  }

  /**
   * Given the table model, it will update the page.
   * This is behaving as a flow-control system, that allows only a Maximum
   * number of requests defined. Requests are generated in this order:
   *
   * 1. main entity
   * 2. aggregate columns
   * 3. facets
   * 4. total count
   *
   * @private
   * @param  {Object} vm The table view model
   */
  private static _updatePage(vm: RecordsetViewModel) {
    $log.debug('counter', vm.flowControlObject.counter, ': running update page');
    if (!vm._haveFreeSlot()) {
      return;
    }

    LogService.updateStackFilterInfo(vm.getTableLogStack(), vm.reference.filterLogInfo);

    // update the resultset
    vm.updateMainEntity(RecordsetViewModel._updatePage, false);

    // get the aggregate values only if main page is loaded
    vm.updateColumnAggregates(RecordsetViewModel._updatePage);

    // do not fetch table count if hideRowCount is set in the annotation for the table
    // this is because the query takes too long sometimes
    if (!vm.reference.display || !vm.reference.display.hideRowCount) {
      // update the count
      vm._updateMainCount(RecordsetViewModel._updatePage);
    }

    // update the facets
    // if (vm.facetModels) {
    //   if (vm.facetsToPreProcess.length === 0) {
    //     vm.facetModels.forEach(function (fm, index) {
    //       if (!fm.preProcessed || fm.processed || !_haveFreeSlot(vm)) {
    //         return;
    //       }

    //       vm.flowControlObject.occupiedSlots++;
    //       fm.processed = true;

    //       (function (i) {
    //         $log.debug("counter", vm.flowControlObject.counter, ": updating facet (index=" + i + ")");
    //         vm.facetModels[i].updateFacet().then(function (res) {
    //           vm.facetModels[i].facetError = false;
    //           _afterFacetUpdate(vm, i, res);
    //           _updatePage(vm);
    //         }).catch(function (err) {
    //           _afterFacetUpdate(vm, i, true);
    //           // show alert if 400 Query Timeout Error
    //           if (err instanceof ERMrest.QueryTimeoutError) {
    //             vm.facetModels[i].facetError = true;
    //           } else {
    //             throw err;
    //           }
    //         });
    //       })(index);
    //     });
    //   }
    //   // initialize facets
    //   else if (_haveFreeSlot(vm)) {
    //     vm.flowControlObject.occupiedSlots++;
    //     var index = vm.facetsToPreProcess.shift();
    //     (function (i, currentCounter) {
    //       $log.debug("counter", vm.flowControlObject.counter, ": initializing facet (index=" + index + ")");
    //       vm.facetModels[i].preProcessFacet().then(function (res) {
    //         $log.debug("counter", currentCounter, ": after facet (index=" + i + ") initialize: " + (res ? "successful." : "unsuccessful."));
    //         vm.flowControlObject.occupiedSlots--;
    //         vm.facetModels[i].preProcessed = true;
    //         vm.facetModels[i].facetError = false;
    //         _updatePage(vm);
    //       }).catch(function (err) {
    //         // show alert if 400 Query Timeout Error
    //         if (err instanceof ERMrest.QueryTimeoutError) {
    //           vm.facetModels[i].facetError = true;
    //         } else {
    //           throw err;
    //         }
    //       });
    //     })(index, vm.flowControlObject.counter);
    //   }
    // }
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
}
