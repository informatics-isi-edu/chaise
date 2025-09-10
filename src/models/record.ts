// models
import {
  RecordsetConfig,
  RecordsetProviderAddUpdateCauses,
  RecordsetProviderFetchSecondaryRequests,
  RecordsetProviderUpdateMainEntity
} from '@isrd-isi-edu/chaise/src/models/recordset'

export interface RecordRelatedModelRecordsetProps {
  page: any,
  pageLimit: number,
  isLoading: boolean,
  isInitialized: boolean,
  hasTimeoutError: boolean,
}

export interface RecordRelatedModel {
  index: number,
  isInline: boolean,
  isPureBinary: boolean,
  initialReference: any,
  /**
   * whether we're showing the tabular view or custom view
   */
  isTableDisplay: boolean,
  /**
   * this indicates that the tableMarkdownContent has been initialized:
   * we should not show the related table before initialzing the tableMarkdownContent
   */
  tableMarkdownContentInitialized: boolean,
  /**
   * the "custom display" content.
   */
  tableMarkdownContent: string|null,
  /**
   * information that the recordset provider shares with record page
   * (has page, isLoading, etc)
   */
  recordsetState: RecordRelatedModelRecordsetProps,
  /**
   * The props that will be passed to the recordset provider for the related model
   */
  recordsetProps: {
    initialPageLimit: number,
    config: RecordsetConfig,
    logInfo: {
      logStack: any,
      logStackPath: string
    },
    parentTuple: any,
    parentReference: any
  },
  canCreate: boolean,
  canCreateDisabled: boolean,
  canEdit: boolean,
  canDelete: boolean,
}

export interface RecordColumnModel {
  index: number,
  column: any,
  hasTimeoutError: boolean,
  isLoading: boolean,
  requireSecondaryRequest: boolean,
  relatedModel?: RecordRelatedModel,
}

export interface RecordRelatedRequestModel {
  index: number,
  /**
   * whether we should do the waitfor logic:
   */
  hasWaitFor: boolean,
  /**
   * this indicates that we got the waitfor data:
   * only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
   */
  waitForDataLoaded: boolean,
  /**
   * to avoid computing this multiple times.
   */
  tableMarkdownContentProcessed: boolean,
  registered: boolean,
  updateMainEntity: RecordsetProviderUpdateMainEntity,
  fetchSecondaryRequests: RecordsetProviderFetchSecondaryRequests,
  addUpdateCauses: RecordsetProviderAddUpdateCauses
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

export interface CitationModel {
  /**
   * the citation object that comes from ERMrestJS
   */
  value: any | null,
  /**
   * whether the value is ready to be looked at
   */
  isReady: boolean
}

export interface ChangeContainerDetails {
  isInline: boolean,
  index: number,
  cause: string
}
