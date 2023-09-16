import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ermrestUtils = require('@isrd-isi-edu/ermrest-data-utils');


export async function setupCatalog(schemaConfigurations: any) {
  return new Promise((resolve, reject) => {

    // merge all the schema configurations
    const catalog: any = {}, schemas: any = {};

    schemaConfigurations.forEach((config: any) => {
      // copy annotations and ACLs over to the submitted catalog object
      if (config.catalog && typeof config.catalog === 'object') {
        if (!('acls' in config.catalog)) {
          config.catalog['acls'] = { 'select': ['*'] };
        }

        // if empty object, this loop is skipped
        for (const prop in config.catalog) {
          // if property is set already
          if (catalog[prop]) {
            console.log(`${prop} is already defined on catalog object, overriding previously set value with new one`);
          }
          catalog[prop] = config.catalog[prop];
        }
      }

      schemas[config.schema.name] = {
        path: config.schema.path
      };

      if (config.entities) {
        schemas[config.schema.name].entities = config.entities.path;
      }
    });

    // create the settings based on the acceptable strucutre.
    // please refer to ermest data utils documentation for the strucutre
    const settings = {
      url: process.env.ERMREST_URL,
      authCookie: process.env.AUTH_COOKIE,
      setup: { catalog, schemas }
    };

    // NOTE do we want ot allow this?
    // reuse the same catalogid
    // if (catalogId) settings.setup.catalog.id = catalogId;

    axios.get(process.env.ERMREST_URL!).then((res) => {
      return ermrestUtils.createSchemasAndEntities(settings);
    }).then(function (data) {
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
    }).catch(function (err) {
      console.log('error while trying to create model and data:');
      console.log(err);
      reject(err);
    });

  });

}

export async function removeCatalog(catalogId: string) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('remove catalog called!');
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

      console.log(`catalog ${catalogId} removed.`);
      resolve(true);
    } catch (exp) {
      console.log(`Unable to remove catalog ${catalogId}`);
      reject(exp);
    }
  });
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
