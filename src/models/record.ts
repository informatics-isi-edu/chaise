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

export class RecordRelatedModel {
  constructor(
    public index: number,
    public isInline: boolean,
    public initialReference: any,
    public isTableDisplay: boolean,
    // this indicates that the tableMarkdownContent has been initialized:
    // we should not show the related table before initialzing the tableMarkdownContent
    public tableMarkdownContentInitialized: boolean,
    public tableMarkdownContent: any, // TODO
    public recordsetState: {
      page: any,
      isLoading: boolean,
      initialized: boolean,
      hasTimeoutError: boolean,
    },
    public recordsetProps: {
      initialPageLimit: number,
      config: RecordsetConfig,
      logInfo: {
        logStack: any,
        logStackPath: string
      }
    }
  ) { }

  /**
   * allow related table markdown display if all the following are true:
   *  - reference.display.type is `markdown`
   *  - related table has data.
   *  - related table's tableMarkdownContent is not empty string
   */
  allowCustomMode = () : boolean => {
    return this.initialReference.display.type === 'markdown' && this.recordsetState.page &&
      this.recordsetState.page.length > 0 && this.tableMarkdownContentInitialized && this.tableMarkdownContent !== '';
  };

  /**
   * whether we should display the custom mode or not
   */
  displayCustomMode = () : boolean => {
    return this.allowCustomMode() && !this.isTableDisplay;
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
