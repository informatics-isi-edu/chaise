// models
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';
import { PrefillObject } from '@isrd-isi-edu/chaise/src/models/recordedit';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { getPrefillObject } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';

export default class RecordeditFlowControl {
  queue: FlowControlQueueInfo;

  /**
   * the prefilled object used for fetching prefilled fks
   */
  prefillObj: null | PrefillObject;

  /**
   * whether we've processed the prefilled fks
   */
  prefillProcessed: boolean;

  /**
   * the requests that should be sent
   */
  foreignKeyRequests: {
    processed: boolean, reference: any, logAction: string, colIndex: number
  }[];

  /**
   * The react-hook-forms function that can be used for setting values
   * NOTE feels hacky, but I think it's fine.
   */
  setValue: any;

  /**
   * create and initialize the flowcontrol object
   * @param queryParams the query parameters on the page (used for finding the prefill object)
   * @param queue should be passed if we want a existing queue
   */
  constructor(queryParams: any, queue?: FlowControlQueueInfo) {
    this.queue = queue ? queue : new FlowControlQueueInfo();

    this.prefillObj = getPrefillObject(queryParams);
    this.prefillProcessed = !this.prefillObj;

    this.foreignKeyRequests = [];
  }

  /**
   * returns true if we have free slots for requests.
   * @param printMessage whether we should print the message about full queue or not
   * @returns
   */
  haveFreeSlot(printMessage = true) {
    const res = this.queue.occupiedSlots < this.queue.maxRequests;
    if (!res && printMessage) {
      $log.debug('No free slot available.');
    }
    return res;
  }

  /**
   * add a foreignkey request
   * @param colIndex  the index of column in list of columnModels
   * @param reference the reference that we're going to read the data from
   * @param logAction the log action string
   */
  addForeignKeyRequest(colIndex: number, reference: any, logAction: string) {
    this.foreignKeyRequests.push({ processed: false, reference, logAction, colIndex });
  }

  /**
   * whether all the requests are processed.
   * can be used to change the state of spinner
   * @returns boolean
   */
  allRequestsProcessed() : boolean {
    return this.prefillProcessed && this.foreignKeyRequests.every((req) => req.processed);
  }

}
