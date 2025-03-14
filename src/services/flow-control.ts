// models
import { LogActions, LogObjectType } from '@isrd-isi-edu/chaise/src/models/log';
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';

// servies
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

export default class FlowControl {

  reloadCauses: string[];
  reloadStartTime: number;

  queue: FlowControlQueueInfo;

  logStack: any;
  logStackPath: string;
  logObject: LogObjectType | undefined;
  logAppMode: string | undefined;

  constructor(
    logInfo: {
      logObject?: LogObjectType,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
    queue?: FlowControlQueueInfo,
  ) {

    this.queue = queue ? queue : new FlowControlQueueInfo();

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
   * Update the reloadCauses list with the given list.
   * It will also take care of adding reloadStartTime if it's necessary.
   * reloadStartTime captures the time that the model becomes dirty.
   * @param causes an array of causes
   */
  addCauses(causes: any[]) {
    if (!Number.isInteger(this.reloadStartTime) || this.reloadStartTime === -1) {
      this.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
    }

    causes.forEach((cause) => {
      if (typeof cause === 'string' && !!cause && this.reloadCauses.indexOf(cause) === -1) {
        this.reloadCauses.push(cause);
      }
    });
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
