// models
import {
  RecordsetConfig,
  RecordsetProviderAddUpdateCauses,
  RecordsetProviderFetchSecondaryRequests,
  RecordsetProviderUpdateMainEntity
} from '@isrd-isi-edu/chaise/src/models/recordset'

// utils
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';

export interface RecordRelatedModelRecordsetProps {
  page: any,
  isLoading: boolean,
  isInitialized: boolean,
  hasTimeoutError: boolean,
}

export interface RecordRelatedModel {
  index: number,
  isInline: boolean,
  isPureBinary: boolean,
  isAlmostPureBinary: boolean,
  initialReference: any,
  isTableDisplay: boolean,
  // this indicates that the tableMarkdownContent has been initialized:
  // we should not show the related table before initialzing the tableMarkdownContent
  tableMarkdownContentInitialized: boolean,
  tableMarkdownContent: string|null, // TODO
  recordsetState: RecordRelatedModelRecordsetProps,
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
  // whether we should do the waitfor logic:
  hasWaitFor: boolean,
  // this indicates that we got the waitfor data:
  // only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
  waitForDataLoaded: boolean,
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
