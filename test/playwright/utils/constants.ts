

/**
 * should be defined the same as src/utils/constants.ts
 *
 * that file is using the "window" object that is not available while running e2e test cases, that's why we cannot
 * import from there and have to duplicate the definition.
 */
export enum APP_NAMES {
  HELP = 'help',
  LOGIN = 'login',
  NAVBAR = 'navbar',
  RECORD = 'record',
  RECORDEDIT = 'recordedit',
  RECORDSET = 'recordset',
  VIEWER = 'viewer'
};
