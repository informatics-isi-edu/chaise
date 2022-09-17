import { RecordsetConfig, RecordsetProviderAddUpdateCauses, RecordsetProviderFetchSecondaryRequests, RecordsetProviderUpdateMainEntity } from '@isrd-isi-edu/chaise/src/models/recordset'

// export enum RecordColumnModelType {
//   LOCAL,
//   RELATED_INLINE,
//   REQUIRE_SECONDARY_REQUEST,
// }

// export interface RecordItemModel {
//   type: RecordColumnModelType,
// }

// export interface RecordColumnModel extends RecordItemModel {
//   isLoading: boolean
// }

export interface RecordRelatedModel {
  index: number,
  isInline: boolean,
  initialReference: any,
  isTableDisplay: boolean,
  // this indicates that the tableMarkdownContent has been initialized:
  // we should not show the related table before initialzing the tableMarkdownContent
  tableMarkdownContentInitialized: boolean,
  tableMarkdownContent: any, // TODO
  recordsetState: {
    page: any,
    isLoading: boolean,
    initialized: boolean,
    hasTimeoutError: boolean,
  },
  recordsetProps: {
    initialPageLimit: number,
    config: RecordsetConfig,
    logInfo: {
      logStack: any,
      logStackPath: string
    }
  }
}

export interface RecordRelatedRequestModel {
  index: number,
  // whether we should do the waitfor logic:
  hasWaitFor: boolean,
  // this indicates that we got the waitfor data:
  // only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
  waitForDataLoaded: boolean,
  registered: boolean,
  updateMainEntity: RecordsetProviderUpdateMainEntity,
  fetchSecondaryRequests: RecordsetProviderFetchSecondaryRequests,
  addUpdateCauses: RecordsetProviderAddUpdateCauses,
}

export interface RecordRequestModel {
  activeListModel: any,
  processed: boolean,
  // TODO maybe we need a sub-type here?
  logStack?: any,
  logStackPath?: string,
  reloadCauses?: string[],
  reloadStartTime?: number,
  reference?: any,
}
