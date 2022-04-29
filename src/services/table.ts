/* eslint max-classes-per-file: 0 */

import { LogActions, LogStackPaths, LogStackTypes } from '@chaise/models/log';
import { LogService } from '@chaise/services/log';
import MathUtils from '@chaise/utils/math-utils';
import TypeUtils from '@chaise/utils/type-utils';
import Q from 'q';
import { RecordsetDisplayMode } from '@chaise/models/recordset';
import { createRedirectLinkFromPath } from '@chaise/utils/uri-utils';
import { ConfigService } from '@chaise/services/config';
import $log from '@chaise/services/logger';
import { URL_PATH_LENGTH_LIMIT } from '@chaise/utils/constants';


class FlowControlQueueInfo {
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
  dirtyResult = false;
  dirtyCount = false;
  dirtyFacets = false;
  requestModels: any = [];
  reloadCauses: any;
  recountCauses: any;
  reloadStartTime: number;
  recountStartTime: number;
  queue: FlowControlQueueInfo;
  logStack: any;
  logStackPath: string;
  logObject: any;
  logAppMode: string | undefined;

  aggregateResults: any;
  templateVariables: any;

  private internalID: string;

  constructor(
    reference: any,
    logInfo: {
      logObject?: any,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
  ) {
    if (reference.activeList) {
      reference.activeList.requests.forEach((activeListModel: any) => {
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
        this.requestModels.push({
          activeListModel, // the api that ermrestjs returns (has .objects and .column)
          processed: true, // whether we should get the data or not
          reloadCauses: [], // why the request is being sent to the server (might be empty)
          reloadStartTime: -1, // when the page became dirty
          logStackNode: pcolStackNode,
        });
      });
    }

    // log related
    this.reloadCauses = [];
    this.recountCauses = [];
    this.reloadStartTime = -1;
    this.recountStartTime = -1;

    // can be used to refer to this current instance of table
    this.internalID = MathUtils.uuid();

    this.queue = new FlowControlQueueInfo();

    this.logStack = logInfo.logStack;
    this.logStackPath = logInfo.logStackPath;
    this.logObject = logInfo.logObject;
    this.logAppMode = logInfo.logAppMode;
  }

  /**
  * returns true if we have free slots for requests.
  * @return {boolean}
  */
  haveFreeSlot() {
    const res = this.queue.occupiedSlots < this.queue.maxRequests;
    if (!res) {
      $log.debug('No free slot available.');
    }
    return res;
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
