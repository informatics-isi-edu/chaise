import axios from 'axios';

import { getCatalogID } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';
import { isObjectAndNotNull } from '@isrd-isi-edu/chaise/src/utils/type-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');

/**
 * create a catalog object based on the given setup object
 * Resolved promise returns the created rows and the id of catalog.
 */
export async function setupCatalog(setup: { catalog: any, schemas: any }): Promise<{ entities: any, catalogId: string }> {
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
 * remove a given catalog
 */
export async function removeCatalog(catalogId: string) {
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
export async function removeAllCatalogs() {
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
 * Delete the given list of namespaces
 * @param  {String[]} namespaces Array of namespaces. They must be absolute path.
 */
exports.deleteHatracNamespaces = function (namespaces: string[]) {
  const promises: any = [];
  namespaces.forEach(function (ns: string) {
    promises.push(axios(ns, {
      method: 'DELETE',
      headers: {
        Cookie: process.env.AUTH_COOKIE!
      }
    }));
  });

  return Promise.all(promises);
}

async function importACLs(params: any) {
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
