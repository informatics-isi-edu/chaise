import fs from 'fs';

import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { resolve } from 'path';
import { TestInfo } from '@playwright/test';

export const ERMREST_URL = process.env.ERMREST_URL;

export const CHAISE_BASE_URL = process.env.CHAISE_BASE_URL;

/**
 * return the catalog created for tests.
 *
 * YOU MUST CALL THIS WITH A PROJECT NAME IF YOU WANT TO GET THE STRING RESULT
 *
 * (populated during setup)
 */
export const getCatalogID = (projectName?: string, dontLogError?: boolean): string | any | null => {
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

/**
 * return the row values based on the given criteria. useful for finding the system generated value of columns.
 */
export const getEntityRow = (testInfo: TestInfo, schema: string, table: string, row: { column: string, value: string }[]) => {
  let match, entities;
  try {
    const fileContent = fs.readFileSync(ENTITIES_PATH, { encoding: 'utf8', flag: 'r' });
    const data = JSON.parse(fileContent);
    entities = data[testInfo.project.name][schema][table];
    if (!Array.isArray(entities)) {
      throw new Error('saved value is not an array.');
    }
  } catch (exp) {
    console.log(`the entities file is eaither missing or doesn't have the proper value. path=${ENTITIES_PATH}`);
    console.log(exp);
    return null;
  }

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    // identifying information for entity could be multiple columns of data
    // which is the case for assocation tables
    for (let j = 0; j < row.length; j++) {
      // eslint-disable-next-line eqeqeq
      if (entity[row[j].column] == row[j].value) {
        match = entity;
      } else {
        match = null;
        // move on to next entity
        break;
      }
    }
    if (match) break;
  }
  return match;
}


export const PRESET_PROJECT_NAME = 'pretest';

/**
 * return the session object for the main user (catalog owner).
 * (populated during setup)
 */
export const getMainUserSessionObject = () => {
  return JSON.parse(process.env.WEBAUTHN_SESSION!);
}


/**
 * the file that contains the logged in browser state
 */
export const MAIN_USER_STORAGE_STATE = resolve(__dirname, '../.auth/user.json');
export const RESTRICTED_USER_STORAGE_STATE = resolve(__dirname, '../.auth/restricted-user.json');


export const DOWNLOAD_FOLDER = resolve(__dirname, '../.download');
