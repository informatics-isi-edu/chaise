export enum appModes {
  COPY = 'copy',
  CREATE = 'create',
  EDIT = 'edit'
}

export type RecordeditProps = {
  /**
   * the mode of the app
   */
  appMode: string;
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
    logObject?: any;
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
   * called when form was submitted successfuly
   */
  onSubmitSuccess?: () => void,
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
  row: any
}

export interface PrefillObject {
  /**
   * the raw value of keys that should be prefilled
   */
  keys: any;
  /**
   * the foreignkey columns that should be prefilled
   */
  fkColumnNames: string[];
  /**
   * the URL to fetch the fk
   */
  origUrl: string;
  /**
   * the rowname of the fk
   */
  rowname: any
}

export interface UploadProgressProps {
  /**
   * rows of data from recordedit form to get file values from
   */
  rows: any[];
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
 * so we can get the select-all input value for a column by doing:
 * getValues()[`${SELECT_ALL_INPUT_FORM_VALUE}-${column.name}]
 */
export const SELECT_ALL_INPUT_FORM_VALUE = -1;
