import { resolve } from 'path';

/**
 * should be defined the same as src/utils/constants.ts
 *
 * that file is using the "window" object that is not available while running e2e test cases, that's why we cannot
 * import from there and have to duplicate the definition.
 */
export enum APP_NAMES {
  MODEL = 'model',
  HELP = 'help',
  LOGIN = 'login',
  NAVBAR = 'navbar',
  RECORD = 'record',
  RECORDEDIT = 'recordedit',
  RECORDSET = 'recordset',
  VIEWER = 'viewer'
}

export const ERMREST_URL : string = process.env.ERMREST_URL!;

export const CHAISE_BASE_URL = process.env.CHAISE_BASE_URL;

/**
 * the file that contains the logged in browser state
 */
export const MAIN_USER_STORAGE_STATE = resolve(__dirname, '../.auth/user.json');
export const RESTRICTED_USER_STORAGE_STATE = resolve(__dirname, '../.auth/restricted-user.json');

export const DOWNLOAD_FOLDER = resolve(__dirname, '../.download');
export const UPLOAD_FOLDER = resolve(__dirname, '../.upload');

/**
 * This is where we're writing the entities to.
 *
 * There are some system generated columns that we might want to know the value of,
 * entities will have those. The problem is that we cannot just attach this variable
 * to `global` since we might run test specs in multiple threads via sharding.
 * Therefore we are writing these data this file, and then removing the file
 *
 * TODO is this limitation true with playwright?
 */
export const ENTITIES_PATH = 'entities.json';

export enum PW_PROJECT_NAMES {
  PRETEST = 'pretest',
  CHROME = 'chromium',
  FIREFOX = 'firefox',
  SAFARI = 'safari'
}

/**
 * Playwright test locks (added in 1.63): tests or describe blocks that share a lock never run at the same time, across files and
 * workers (https://playwright.dev/docs/test-parallel#test-locks). With `fullyParallel: false` (our default), the
 * lock is held for the duration of the whole file, including its beforeAll/afterAll hooks.
 */
export enum TEST_LOCKS {
  /**
   * for specs that mutate the catalog model (annotations, ACLs). the parallel configs share one catalog per
   * group, and ERMrest serializes model mutations: two specs changing the model at the same time get a 503,
   * even when they touch different endpoints or different tables.
   */
  CATALOG_MODEL = 'catalog-model'
}
