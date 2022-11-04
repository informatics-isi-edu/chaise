// models
import { LogActions, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';

// servies
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import FlowControl from '@isrd-isi-edu/chaise/src/services/flow-control';

// utils
import { generateUUID } from '@isrd-isi-edu/chaise/src/utils/math-utils';

export default class RecordsetFlowControl extends FlowControl {
  dirtyResult = false;
  dirtyCount = false;
  dirtyFacets = false;
  requestModels: any = [];

  recountCauses: any;
  recountStartTime: number;

  updateFacetsCallback?: Function;
  updateFacetStatesCallback?: Function;
  getAppliedFilters?: Function;
  removeAppliedFilters?: Function;
  focusOnFacet?: Function;


  lastActiveFacet?: number;

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
    queue?: any
  ) {
    super(logInfo, queue);

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

    this.recountCauses = [];
    this.recountStartTime = -1;

    // can be used to refer to this current instance of table
    this.internalID = generateUUID();
  }
}
