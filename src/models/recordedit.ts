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
}

export interface TimestampOptions {
  currentMomentFormat?: string;
  outputMomentFormat: string;
}
