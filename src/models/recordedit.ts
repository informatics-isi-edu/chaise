export const appModes = {
  COPY: 'copy',
  CREATE: 'create',
  EDIT: 'edit'
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
  onCancel: () => void;
}