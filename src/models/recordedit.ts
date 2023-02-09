export const appModes = {
  COPY: 'copy',
  CREATE: 'create',
  EDIT: 'edit'
}

export interface RecordeditColumnModel {
  column: any;
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
