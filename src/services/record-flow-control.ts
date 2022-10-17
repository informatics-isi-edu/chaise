// models
import { FlowControlQueueInfo } from '@isrd-isi-edu/chaise/src/models/flow-control';
import { RecordRelatedRequestModel, RecordRequestModel } from '@isrd-isi-edu/chaise/src/models/record';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import FlowControl from '@isrd-isi-edu/chaise/src/services/flow-control';

export default class RecordFlowControl extends FlowControl {
  dirtyMain = false;

  requestModels: RecordRequestModel[] = [];
  inlineRelatedRequestModels: { [index: string]: RecordRelatedRequestModel } = {};
  relatedRequestModels: RecordRelatedRequestModel[] = [];
  numColsRequireSecondaryRequests = 0;

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

  constructor(
    logInfo: {
      logObject?: any,
      logStack: any,
      logStackPath: string,
      logAppMode?: string
    },
    queue?: FlowControlQueueInfo,
  ) {
    super(logInfo, queue);
  }

  addCausesToRequestModel(m: RecordRequestModel, causes: any[]) {
    // the time that will be logged with the request
    if (!Number.isInteger(m.reloadStartTime) || m.reloadStartTime === -1) {
      m.reloadStartTime = ConfigService.ERMrest.getElapsedTime();
    }

    if (!Array.isArray(m.reloadCauses)) {
      m.reloadCauses = [];
    }
    causes.forEach((cause) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (typeof cause === 'string' && !!cause && m.reloadCauses!.indexOf(cause) === -1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        m.reloadCauses!.push(cause);
      }
    });
  }

}
