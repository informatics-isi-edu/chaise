// models
import { LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

type RecordRequestModel = {
  activeListModel: any;
  processed: boolean;
  logStack: any;
  logStackPath: string;
  reloadCauses: string[];
  reloadStartTime: number;
  reference?: any;
}

export default class RecordFlowControl {
  dirtyMain = false;
  reloadCauses: string[];
  reloadStartTime: number;

  requestModels: RecordRequestModel[];

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

  constructor(reference: any, queue?: FlowControlQueueInfo) {

    this.queue = queue ? queue : new FlowControlQueueInfo(6);

    this.reloadStartTime = -1;
    this.reloadCauses = [];

    this.requestModels = [];
    reference.activeList.requests.forEach((req: any) => {

      if (req.entityset || req.aggregate) {
        const extra: { source: any, entity: boolean, agg?: string } = {
          source: req.column.compressedDataSource,
          entity: req.column.isEntityMode,
        };
        if (req.aggregate) {
          extra.agg = req.column.aggregateFn;
        }

        this.requestModels.push({
          activeListModel: req,
          processed: false,
          // these attributes are used for logging purposes:
          logStack: LogService.getStackObject(
            LogService.getStackNode(LogStackTypes.PSEUDO_COLUMN, req.column.table, extra)
          ),
          logStackPath: LogService.getStackPath(null, LogStackPaths.PSEUDO_COLUMN),
          reloadCauses: [],
          reloadStartTime: -1,
          // to avoid computing this multiple times
          // this reference is going to be used for getting the values
          ...(req.entityset && { reference: req.column.reference.contextualize.compactBrief })
        });
      }
    });

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
}
