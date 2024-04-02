import { readFileSync } from 'fs';
import { TestInfo } from '@playwright/test';

import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { ENTITIES_PATH } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

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
          if (!data.schemas.hasOwnProperty(schemaName)) continue;

          const schema = data.schemas[schemaName];
          entities[schema.name] = {};

          for (const t in schema.tables) {
            if (!schema.tables.hasOwnProperty(t)) continue;

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

/**
 * remove a given catalog
 */
export const removeCatalog = async (catalogId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      await ermrestUtils.tear({
        // NOTE this setup is needed by ermrest-data-utils
        // we should refactor ermrest-data-utils to not need this
        setup: {
          catalog: {}
        },
        url: process.env.ERMREST_URL,
        catalogId: catalogId,
        authCookie: process.env.AUTH_COOKIE
      });
      resolve(true);
    } catch (exp) {
      console.log(`Unable to remove catalog ${catalogId}`);
      reject(exp);
    }
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

export const importACLs = async (params: any) => {
  return new Promise((resolve, reject) => {
    ermrestUtils.importACLS({
      url: process.env.ERMREST_URL,
      authCookie: process.env.AUTH_COOKIE,
      setup: params
    }).then(function () {
      console.log('successfully updated the ACLs');
      resolve(true);
    }).catch(function (err: any) {
      console.log('error while trying to change ACLs');
      console.dir(err);
      reject(err);
    });

  })
}

export const updateCatalogAnnotation = async (catalogId: string, annotation: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const catalogObj = {
      url: process.env.ERMREST_URL,
      id: catalogId
    };
    ermrestUtils.createOrModifyCatalog(catalogObj, annotation, null).then(function () {
      console.log('successfully updated the catalog annotation');
      resolve();
    }).catch((err: any) => {
      console.log('error while trying to update catalog annotation');
      reject(err);
    });
  });
}

