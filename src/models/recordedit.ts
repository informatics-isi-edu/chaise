import { LogObjectType } from '@isrd-isi-edu/chaise/src/models/log';
import {
  RecordsetProviderGetDisabledTuples, SelectedRow
} from '@isrd-isi-edu/chaise/src/models/recordset';


export enum appModes {
  COPY = 'copy',
  CREATE = 'create',
  EDIT = 'edit'
}

export type RecordeditProps = {
  /**
   * the mode of the app
   */
  appMode: appModes;
  /**
   * the config object
   */
  config: RecordeditConfig;
  /**
   * main reference of the form
   */
  reference: any;
  /**
   * log related properties
   */
  logInfo: {
    logAppMode: string;
    logObject?: LogObjectType;
    logStack: any;
    logStackPath: string;
  },
  /**
   * the query parameters that the page might have
   */
  queryParams: any;
  /**
   * parameters for the modal
   */
  modalOptions?: RecordeditModalOptions;
  /**
   * modify submission rows prior to submission
   */
  modifySubmissionRows?: (submissionRows: any[]) => void,
  /**
   * called when form was submitted successfuly
   */
  onSubmitSuccess?: (response: { successful: any, failed: any, disabled: any }) => void,
  /**
   * called when form submission (create/update request) errored out
   * return true from this function if you want recordedit to show the alert.
   */
  onSubmitError?: (exception: any) => boolean,
  /**
   * initial data that you want to be displayed (only honored in create mode)
   */
  prefillRowData?: any[];
  /**
   * the tuples that we want to edit (only honored in edit mode)
   */
  initialTuples?: any[],
  /**
   * the container of this recordedit instance.
   */
  parentContainer?: HTMLElement;
  /**
   * name of the columns that should be hidden
   */
  hiddenColumns?: string[];
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks
}

export enum RecordeditDisplayMode {
  FULLSCREEN = 'fullscreen',
  POPUP = 'popup',
  VIEWER_ANNOTATION = 'viewer-annotation',
}

export type RecordeditConfig = {
  displayMode: RecordeditDisplayMode
}

export type RecordeditModalOptions = {
  parentReference: any;
  onClose: () => void;
}

export type UpdateBulkForeignKeyRowsCallback = (formNumber: number, newRow?: SelectedRow) => void;
export type RecordeditForeignkeyCallbacks = {
  /**
   * if defined, called before loading the foreign key picker or association modal
   *
   * This will disable the rows in the modal popup that are already associated with the main
   * record we are associating more rows with. This will only occur when there is a prefillObject
   * and the association is unique
   */
  getDisabledTuples?: RecordsetProviderGetDisabledTuples,
  /**
   * if defined, will be called after closing the modal selector
   *
   * This will call a function in recordedit provider to update the selected rows for the
   * association popup if we have a prefillObject and the association is unique
   */
  updateBulkForeignKeySelectedRows?: UpdateBulkForeignKeyRowsCallback,
  /**
   * if defined, will be used in foreign key & foreign key dropdown fields
   */
  bulkForeignKeySelectedRows?: (SelectedRow | null)[],
  /**
   * if defined, will be used for validating the foreign key value.
   *
   * return `true` if the value is valid. otherwise return a string that will be showed as an error.
   */
  onChange?: (column: any, rowData: any) => true | string,
  /**
   * if defined, will be called before opening the modal selector.
   * The returned promise must be resolved with an object with the following props:
   * - allowed: whether we can continue with opening the fk popup/dropdown
   * - domainFilterFormNumber: The formNumber that should be used for generating the filteredRef
   *   (this is useful for multi-form input where we're not necessarily have the first form selected)
   */
  onAttemptToChange?: () => Promise<{ allowed: boolean, domainFilterFormNumber?: number }>;
}

export interface RecordeditColumnModel {
  column: any;
  /**
   * NOTE
   * whether the column should be disabled based on model, or is prefilled.
   * this will not properly handle per-column dynamic ACLs and we should use
   * getInputTypeOrDisabled for it instead.
   */
  isDisabled: boolean;
  isRequired: boolean;
  inputType: string;
  logStackNode: any;
  logStackPathChild: string;
  /**
   * Whether this is a foreignkey column and has domain-filter.
   * if this is true, on load, we have to wait for all the foreignkey values to load.
   */
  hasDomainFilter: boolean;
  /**
   * whether we should show the input or not
   * (used in viewer app to hide the columns)
   */
  isHidden: boolean;
  /**
   * whether to trigger using the unqiue features of bulk foreign key create
   */
  isLeafInUniqueBulkForeignKeyCreate: boolean;
}

export interface TimestampOptions {
  currentMomentFormat?: string;
  outputMomentFormat: string;
}

export interface FileObject {
  file?: any;
  hatracObj?: any;
  url: string;
  filename: string;
  filesize: number;
}

export interface UploadFileObject {
  name: string;
  size: number;
  humanFileSize: string;
  checksumProgress: number;
  checksumPercent: number;
  checksumCompleted: boolean;
  partialUpload: boolean;
  uploadKey: string;
  skipUploadJob?: boolean;
  jobCreateDone: boolean;
  fileExistsDone: boolean;
  uploadCompleted: boolean;
  uploadStarted: boolean;
  completeUploadJob: boolean;
  progress: number;
  progressPercent: number;
  hatracObj: any;
  url: string;
  versionedUrl?: string;
  column: any,
  reference: any,
  /**
   * main table data
   */
  row: any,
  /**
   * outbound fk data
   */
  linkedData: any,
  /**
   * the waitfor data
   */
  templateVariables: any,
  /**
   * which row this is
   */
  rowIdx: number
}

export interface PrefillObject {
  /**
   * the raw values of each column that should be prefilled keyed by column name
   */
  keys: any;
  /**
   * the foreignkey columns that should be prefilled
   */
  fkColumnNames: string[];
  /**
   * map of column names as keys to column RIDs as values
   */
  columnNameToRID: { [key: string]: string };
  /**
   * the URL to fetch the fk
   */
  origUrl: string;
  /**
   * the rowname of the fk
   */
  rowname: any;
}

export interface LastChunkMap {
  /* key in the form of `${file.md5_base64}_${column_name}_${record_index}` */
  [key: string]: LastChunkObject;
}

export interface LastChunkObject {
  /* the index of the last chunk that was uploaded */
  lastChunkIdx: number;
  /* the path to the file being uploaded and it's specific upload job */
  jobUrl: string;
  /* the size of the file being uploaded */
  fileSize: number;
  /* the path to the file after it's been uploaded and version info is generated */
  uploadVersion?: string;
}

export interface UploadProgressProps {
  /**
   * rows of data from recordedit forms to get file values from
   */
  rows: any[];
  /**
   * the outbound fk values (linke data) for all the forms
   */
  linkedData: any[];
  /**
   * the template variables (wait for data) for all the forms
   */
  templateVariables: any[];
  /**
   * prop to trigger on delete confirmation
   */
  onSuccess: () => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: (exception?: any) => void;
}

/**
 * so we can get the multi form input value for a column by doing:
 * getValues()[`${MULTI_FORM_INPUT_FORM_VALUE}-${column.name}]
 */
export const MULTI_FORM_INPUT_FORM_VALUE = -1;
