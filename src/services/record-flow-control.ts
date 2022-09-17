// models
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';
import { RecordRelatedRequestModel, RecordRequestModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

export default class RecordFlowControl {
  dirtyMain = false;
  reloadCauses: string[];
  reloadStartTime: number;

  requestModels: RecordRequestModel[] = [];
  relatedRequestModels: RecordRelatedRequestModel[] = [];

  /**
   * the initial values for the templateVariables
   */
  templateVariables: any;
  /**
   * the aggregate values
   */
  aggregateResults: any;
  /**
   * indicator that the entityset values are fetched
   */
  entitySetResults: any;

  queue: FlowControlQueueInfo;

  logStack: any;
  logStackPath: string;
  logObject: any;
  logAppMode: string | undefined;

  constructor(
    logInfo: {
      logObject?: any,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
    queue?: FlowControlQueueInfo,
  ) {

    this.queue = queue ? queue : new FlowControlQueueInfo(6);

    this.reloadStartTime = -1;
    this.reloadCauses = [];

    this.logStack = logInfo.logStack;
    this.logStackPath = logInfo.logStackPath;
    this.logObject = logInfo.logObject;
    this.logAppMode = logInfo.logAppMode;
  }

  /**
  * returns true if we have free slots for requests.
  * @return {boolean}
  */
  haveFreeSlot(printMessage = true) {
    const res = this.queue.occupiedSlots < this.queue.maxRequests;
    if (!res && printMessage) {
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
  getLogAction(actionPath: LogActions, childStackPath?: any): string {
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
  getLogStack(childStackElement?: any, extraInfo?: any): any {
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
