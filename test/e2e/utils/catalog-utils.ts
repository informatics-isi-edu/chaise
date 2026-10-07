import { appendFileSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { basename, join } from 'path';
import { TestInfo } from '@playwright/test';
import axios, { isAxiosError } from 'axios';

import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import {
  APP_NAMES, ENTITIES_PATH, HATRAC_NAMESPACES_PATH, STATE_FOLDER
} from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');

/**
 * create a catalog object based on the given setup object
 * Resolved promise returns the created rows and the id of catalog.
 */
export const setupCatalog = async (setup: { catalog: any, schemas: any }): Promise<{ entities: any, catalogId: string }> => {
  return new Promise((resolve, reject) => {

    // create the settings based on the acceptable strucutre.
    // please refer to ermest data utils documentation for the strucutre
    const settings = {
      url: process.env.ERMREST_URL,
      authCookie: process.env.AUTH_COOKIE,
      setup: setup
    };

    // NOTE do we want ot allow this?
    // reuse the same catalogid
    // if (catalogId) settings.setup.catalog.id = catalogId;

    ermrestUtils.createSchemasAndEntities(settings).then(function (data: any) {
      const entities: any = {};

      if (data.schemas) {
        for (const schemaName in data.schemas) {
          if (!Object.prototype.hasOwnProperty.call(data.schemas, schemaName)) continue;

          const schema = data.schemas[schemaName];
          entities[schema.name] = {};

          for (const t in schema.tables) {
            if (!Object.prototype.hasOwnProperty.call(schema.tables, t)) continue;

            entities[schema.name][t] = schema.tables[t].entities;
          }
        }
        console.log('Attached entities for the schemas');
      }
      resolve({ entities: entities, catalogId: data.catalogId });
    }).catch(function (err: any) {
      console.log('error while trying to create model and data:');
      console.log(err);
      reject(err);
    });
  });
}

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


export type EntityRowColumnValues = { column: string, value: string }[];

/**
 * return the row values based on the given criteria. useful for finding the system generated value of columns.
 */
export const getEntityRow = (testInfo: TestInfo, schema: string, table: string, row: EntityRowColumnValues) => {
  let match, entities;
  try {
    const fileContent = readFileSync(ENTITIES_PATH, { encoding: 'utf8', flag: 'r' });
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

export const getEntityRowURL = (testInfo: TestInfo, appName: APP_NAMES, schemaName: string, tableName: string, rowVal: EntityRowColumnValues) => {
  const savedData = getEntityRow(testInfo, schemaName, tableName, rowVal);
  return `/${appName}/#${getCatalogID(testInfo.project.name)}/${schemaName}:${tableName}/RID=${savedData.RID}`;
};

/**
 * remove a given catalog
 */
export const removeCatalog = async (catalogId: string) => {
  return new Promise((resolve, reject) => {
      ermrestUtils.tear({
        // NOTE this setup is needed by ermrest-data-utils
        // we should refactor ermrest-data-utils to not need this
        setup: {
          catalog: {}
        },
        url: process.env.ERMREST_URL,
        catalogId: catalogId,
        authCookie: process.env.AUTH_COOKIE
      }).then(() => {
        resolve(true);
      }).catch((exp: unknown) => {
        console.log(`Unable to remove catalog ${catalogId}`);
        if (isAxiosError(exp)) {
          console.log(exp.response?.data);
        } else {
          console.log('An unexpected error occurred:', exp);
        }
        reject(exp);
    });
  });
}

/**
 * Remove all the catalogs based on the env variable
 */
export const removeAllCatalogs = async () => {
  const catalogIds = getCatalogID();
  if (isObjectAndNotNull(catalogIds)) {
    for (const p in catalogIds) {
      await removeCatalog(catalogIds[p]);
      console.log(`Catalog deleted with id ${catalogIds[p]} for project ${p}`);
    }
  } else {
    console.log('Catalog information is missing (either not created or invalid env variable).')
  }
  return true;
}

/**
 * how many times we attempt a catalog model change before giving up.
 */
const MODEL_CHANGE_MAX_ATTEMPTS = 5;

/**
 * whether the given error is an ERMrest 503.
 */
const isServiceUnavailable = (err: any): boolean => {
  if (isAxiosError(err)) return err.response?.status === 503;
  return err?.response?.status === 503 || err?.status === 503;
};

/**
 * Run a catalog model change (annotation or ACL) and retry it if ERMrest answers with a 503.
 *
 * ERMrest serializes model mutations and returns a 503 when it cannot take another one right away.
 * Test locks keep our own specs from mutating the model at the same time, but the catalog is still
 * busy serving reads from the other workers, so a 503 can happen anyway. Backoff is exponential with
 * jitter so that retries from different workers don't line up again.
 *
 * @param label used in the retry log line so it's clear which call is being retried
 * @param fn the request to run
 */
const retryOnServiceUnavailable = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isServiceUnavailable(err) || attempt === MODEL_CHANGE_MAX_ATTEMPTS) throw err;

      const delay = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      console.log(`${label}: ERMrest returned 503, retrying in ${delay}ms (attempt ${attempt} of ${MODEL_CHANGE_MAX_ATTEMPTS})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const importACLs = async (params: any) => {
  try {
    await retryOnServiceUnavailable('importACLs', () => ermrestUtils.importACLS({
      url: process.env.ERMREST_URL,
      authCookie: process.env.AUTH_COOKIE,
      setup: params
    }));
    console.log('successfully updated the ACLs');
    return true;
  } catch (err: any) {
    console.log('error while trying to change ACLs');
    console.dir(err);
    throw err;
  }
}

export const updateCatalogAnnotation = async (catalogId: string, annotation: any): Promise<void> => {
  const catalogObj = {
    url: process.env.ERMREST_URL,
    id: catalogId
  };

  try {
    await retryOnServiceUnavailable(
      'updateCatalogAnnotation',
      () => ermrestUtils.createOrModifyCatalog(catalogObj, process.env.AUTH_COOKIE, annotation, null)
    );
  } catch (err: any) {
    console.log('error while trying to update catalog annotation');
    if (isAxiosError(err)) {
      console.log(err.response?.data);
    } else {
      console.log('An unexpected error occurred:', err);
    }
    throw err;
  }
}

export const updateCatalogAlias = async (catalogId: string, alias: string): Promise<void> => {
  const catalogObj = {
    url: process.env.ERMREST_URL,
    id: catalogId
  };

  try {
    await retryOnServiceUnavailable(
      'updateCatalogAlias',
      () => ermrestUtils.createOrModifyCatalog(catalogObj, process.env.AUTH_COOKIE, undefined, undefined, alias)
    );
  } catch (err: any) {
    console.log('error while trying to update catalog alias');
    if (isAxiosError(err)) {
      console.log(err.response?.data);
    } else {
      console.log('An unexpected error occurred:', err);
    }
    throw err;
  }
}

/**
 * copy from the given location to the deployed location of chaise
 * @param fileLocation the file or folder that we want to copy
 * @param destinationFilename the relative path that we want this file or folder to be added to (relative to remote chaise)
 * @param isFolder whether this is a  file or folder
 */
export const copyFileToChaiseDir = (fileLocation: string, destinationFilename: string, isFolder?: boolean) => {
  const remoteChaiseDirPath = process.env.REMOTE_CHAISE_DIR_PATH;
  // The tests will take this path when it is not running on CI and remoteChaseDirPath is not null
  let cmd;
  if (typeof remoteChaiseDirPath === 'string') {
    cmd = `scp ${isFolder ? '-r ' : ''}${fileLocation} ${remoteChaiseDirPath}/${destinationFilename}`;
  } else {
    cmd = `sudo cp ${isFolder ? '-r ' : ''}${fileLocation} /var/www/html/chaise/${destinationFilename}`;
  }

  try {
    execSync(cmd);
    console.log(`copied ${destinationFilename} ${isFolder ? 'folder' : 'file'} into the proper location.`);
  } catch (exp) {
    console.log(exp);
    console.log(`Unable to copy ${destinationFilename} ${isFolder ? 'folder' : 'file'}!`);
    process.exit(1);
  }
}

/**
 * Delete the given hatrac namespace or object and everything under it.
 *
 * Hatrac's namespace DELETE currently leaves the object versions (and their files) behind. So the objects are deleted
 * first, which deletes their versions, and then the root namespace, which deletes the rest of the names.
 * @param path relative path of the namespace or object starting with `/hatrac/`
 * @param isRoot whether this is the namespace that was registered. A 404 under it means it was already deleted.
 */
const deleteHatracResource = async (path: string, isRoot = true): Promise<void> => {
  const headers = { Cookie: process.env.AUTH_COOKIE! };
  const cleanPath = path.replace(/\/+$/, '');
  /*
   * resolve the path against the ermrest url, so it doesn't end up with `//hatrac`.
   * hatrac doesn't recognize its prefix in that case and returns 404.
   * NOTE: the ERMREST_URL constant can't be used here. In CI, the playwright config sets the env variable after importing
   * the constants, so the constant is undefined in global setup and teardown.
   */
  const toURL = (p: string) => new URL(p, process.env.ERMREST_URL);
  const okOrGone = (status: number) => (status >= 200 && status < 300) || (!isRoot && status === 404);

  // only objects have the versions sub-resource
  const versions = await axios.get(toURL(`${cleanPath};versions`).toString(), {
    headers,
    validateStatus: (status) => status === 200 || status === 404,
  });
  const isObject = versions.status === 200;

  if (!isObject) {
    const listing = await axios.get(toURL(cleanPath).toString(), {
      headers: { ...headers, Accept: 'application/json' },
      validateStatus: okOrGone,
    });
    // already deleted
    if (listing.status === 404) return;

    if (!Array.isArray(listing.data)) {
      throw new Error(`unexpected hatrac listing for ${cleanPath}`);
    }

    const parentPath = toURL(cleanPath).pathname;
    for (const child of listing.data) {
      const childPath = typeof child === 'string' ? toURL(child).pathname : '';
      const relative = childPath.slice(parentPath.length + 1);
      // only follow direct children, so nothing outside of the namespace is deleted
      if (!childPath.startsWith(`${parentPath}/`) || !relative || relative.includes('/')) {
        throw new Error(`unexpected child ${child} in hatrac listing for ${cleanPath}`);
      }
      await deleteHatracResource(childPath, false);
    }
  }

  // the nested namespaces are deleted along with the root
  if (isObject || isRoot) {
    await axios.delete(toURL(cleanPath).toString(), { headers, validateStatus: okOrGone });
  }
};

/**
 * delete the hatrac namespaces that are created during testing
 * @param namespaces relative paths for the namespaces starting with `/ .e.g. `/hatrac/js/chaise/some_name`
 * @returns the namespaces that couldn't be deleted
 */
export const deleteHatracNamespaces = async (namespaces: string[]): Promise<string[]> => {
  const failed: string[] = [];
  // cleanup the hatrac namespaces
  for (const ns of namespaces) {
    try {
      await deleteHatracResource(ns);
      console.log(`${ns} hatrac namespace deleted.`);
    } catch (e) {
      /*
       * nothing to delete (e.g. the spec failed before uploading). there's no point in trying again,
       * but it's logged since it would also happen if the url is wrong.
       */
      if (isAxiosError(e) && e.response?.status === 404) {
        console.warn(`nothing found at hatrac namespace ${ns}, so it was not deleted.`);
        continue;
      }

      failed.push(ns);
      console.log(`encountered an error while trying to delete hatrac namespace: ${ns}`);
      if (isAxiosError(e)) {
        // e.config itself shouldn't be logged since it has the cookie
        console.error(`${e.config?.method?.toUpperCase()} ${e.config?.url} returned ${e.response?.status}`, e.response?.data);
      } else {
        console.error('An unexpected error occurred:', e);
      }
    }
  }
  return failed;
}

/**
 * Keep track of a hatrac namespace that a spec uploads files to. Call this before uploading any files.
 * Specs shouldn't delete the namespace themselves. The global teardown deletes all of them (or the next global setup,
 * if the test run was killed), so each one is deleted once even if the spec fails.
 * @param namespace relative path of the namespace starting with `/` e.g. `/hatrac/js/chaise/some_name`
 */
export const registerHatracNamespace = (namespace: string) => {
  mkdirSync(STATE_FOLDER, { recursive: true });
  // appending a short line is atomic, so it's safe with multiple workers
  appendFileSync(HATRAC_NAMESPACES_PATH, `${namespace}\n`);
}

/**
 * Delete all the hatrac namespaces that were registered using `registerHatracNamespace`.
 * The ones that couldn't be deleted are registered again, so the next run can try again.
 */
export const deleteRegisteredHatracNamespaces = async () => {
  const registryName = basename(HATRAC_NAMESPACES_PATH);

  /*
   * claim the registered namespaces by renaming the file (atomic), so anything that is registered in the meantime goes
   * to a new file and isn't lost. claimed files that are left behind by a cleanup that was killed are picked up too.
   */
  try {
    renameSync(HATRAC_NAMESPACES_PATH, `${HATRAC_NAMESPACES_PATH}.${process.pid}-${Date.now()}.claimed`);
  } catch {
    // nothing is registered
  }

  let claimedFiles: string[] = [];
  try {
    claimedFiles = readdirSync(STATE_FOLDER)
      .filter((f) => f.startsWith(`${registryName}.`) && f.endsWith('.claimed'))
      .map((f) => join(STATE_FOLDER, f));
  } catch {
    // the folder doesn't exist, so nothing was registered
  }
  if (claimedFiles.length === 0) return;

  const content = claimedFiles.map((f) => readFileSync(f, { encoding: 'utf8' })).join('\n');
  const namespaces = [...new Set(content.split('\n').filter((ns) => ns.length > 0))];
  const failed = await deleteHatracNamespaces(namespaces);

  failed.forEach((ns) => registerHatracNamespace(ns));
  claimedFiles.forEach((f) => rmSync(f, { force: true }));

  if (failed.length > 0) {
    console.warn(
      `${failed.length} hatrac namespace(s) couldn't be deleted and will be retried in the next run:\n  ${failed.join('\n  ')}`
    );
  }
}
