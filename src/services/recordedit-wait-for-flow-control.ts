// models
import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

/**
 * The flow control for loading the wait-for columns required for the asset columns
 */
export default class RecordeditWaitForFlowControl {
  queue: FlowControlQueueInfo;

  /**
   * the requests that should be sent
   */
  waitForRequests: {
    /**
     * whether the request is processed (either finished or waiting)
     */
    processed: boolean,
    /**
     * whether we're waiting for the request to finish
     */
    isLoading: boolean,
    /**
     * the wait-for column object
     * (used for fetching the data)
     */
    waitForColumn: any,
    /**
     * the index of the column in the list of columnModels
     * (used for setting the value))
     */
    colIndex: number,
    /**
     * the log stack node for the request
     */
    logStackNode: any
  }[] = [];

  /**
   * the computed template variables
   */
  templateVariables: any[] = [];

  /**
   * create and initialize the flowcontrol object
   * @param queryParams the query parameters on the page (used for finding the prefill object)
   * @param queue should be passed if we want a existing queue
   */
  constructor(reference: any, queue?: FlowControlQueueInfo) {
    this.queue = queue ? queue : new FlowControlQueueInfo();

    if (reference.activeList) {
      reference.activeList.requests.forEach((activeListModel: any) => {
        if (!activeListModel.firstOutbound) return;

        const logStackNode = LogService.getStackNode(
          LogStackTypes.PSEUDO_COLUMN,
          activeListModel.column.table,
          {
            source: activeListModel.column.compressedDataSource,
            entity: activeListModel.column.isEntityMode,
            ...(activeListModel.column.aggregateFn && { agg: activeListModel.column.aggregateFn }),
          },
        );
        this.waitForRequests.push({
          processed: false,
          isLoading: true,
          waitForColumn: activeListModel.column,
          colIndex: activeListModel.index,
          logStackNode
        });
      });
    }
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
   * restart the flow-contorl
   */
  reset() {
    this.queue.occupiedSlots = 0;
    this.templateVariables = [];
    this.waitForRequests.forEach((req) => {
      req.processed = false;
      req.isLoading = true;
    });
  }

  /**
   * whether all the requests are finished.
   * can be used to change the state of spinner
   * @returns boolean
   */
  allRequestsFinished(): boolean {
    return this.waitForRequests.every((req) => req.processed && !req.isLoading);
  }

}
