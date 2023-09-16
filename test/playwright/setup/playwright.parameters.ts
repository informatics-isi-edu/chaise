import { resolve } from 'path';

export const ERMREST_URL = process.env.ERMREST_URL;

/**
 * return the catalog created for tests
 * (populated during setup)
 */
export const getCatalogID = () : string => {
  return process.env.CATALOG_ID!;
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
