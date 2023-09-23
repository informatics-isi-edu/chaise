import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { resolve } from 'path';

export const ERMREST_URL = process.env.ERMREST_URL;

/**
 * return the catalog created for tests.
 *
 * YOU MUST CALL THIS WITH A PROJECT NAME IF YOU WANT TO GET THE STRING RESULT
 *
 * (populated during setup)
 */
export const getCatalogID = (projectName?: string, dontLogError?: boolean) : string | any | null => {
  try {
    const obj = JSON.parse(process.env.CATALOG_ID!);
    if (!isObjectAndNotNull(obj) || (projectName && !obj[projectName])) {
      throw new Error('');
    }
    return projectName ? obj[projectName] : obj;
  } catch (exp) {
    if (!dontLogError) {
      console.error(exp);
      console.log('existing CATALOG_ID env variable value is not valid.');
    }
  }

  return null;
}

export const setCatalogID = (projectName: string, catalogId: string) => {
  let curr = getCatalogID(undefined, true);
  if (isObjectAndNotNull(curr)) {
    curr[projectName] = catalogId;
  } else {
    curr = {};
    curr[projectName] = catalogId;
  }
  process.env.CATALOG_ID = JSON.stringify(curr);
}


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

export const PRESET_PROJECT_NAME = 'pretest';

/**
 * return the session object for the main user (catalog owner).
 * (populated during setup)
 */
export const getMainUserSessionObject = () => {
  return  JSON.parse(process.env.WEBAUTHN_SESSION!);
}


/**
 * the file that contains the logged in browser state
 */
export const STORAGE_STATE = resolve(__dirname, '../.auth/user.json');
