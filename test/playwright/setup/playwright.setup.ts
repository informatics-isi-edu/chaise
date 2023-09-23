import { FullConfig } from '@playwright/test';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';

import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import { removeAllCatalogs, setupCatalog } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.import';
import { ENTITIES_PATH, PRESET_PROJECT_NAME, setCatalogID } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

/**
 *
 * 1. grab the test configuration based on the given configFileName.
 * 2. check the user cookies
 * 3. create the catalog
 * 4. copy the chaise config
 * 5. add sigint and other callbacks.
 *
 */
export default async function globalSetup(config: FullConfig) {
  /**
   * the only way to pass config to here is using the env variables
   */
  let optionsEnv = process.env.PLAYWRIGHT_TEST_OPTIONS;
  optionsEnv = typeof optionsEnv === 'string' ? JSON.parse(optionsEnv) : {};
  if (typeof optionsEnv !== 'object') {
    throw new Error('test options was not passed to the global setup.');
  }

  const options: TestOptions = optionsEnv;

  // TODO testConfiguration is a bit different in the protractor version
  // grab the data files
  let testConfiguration;
  if (options.configFileName) {
    if (options.manualTestConfig) {
      testConfiguration = require(`../../manual/data_setup/config/${options.configFileName}`);
    } else {
      testConfiguration = require(`../../e2e/data_setup/config/${options.configFileName}`);
    }
  }

  if (typeof testConfiguration !== 'object') {
    throw new Error('config file is empty.');
  }

  const projectNames: string[] = [];
  config.projects.forEach((p) => {
    if (p.name === PRESET_PROJECT_NAME) return;
    projectNames.push(p.name);
  });


  // see if the user/pass or cookie are valid
  try {
    const result = await checkUserSessions();
    process.env.WEBAUTHN_SESSION = JSON.stringify(result.session);

    if (!process.env.AUTH_COOKIE) {
      process.env.AUTH_COOKIE = result.authCookie;
    }
  } catch (exp) {
    throw exp;
  }

  // make sure ermrest-data-utils has the cookie
  testConfiguration.authCookie = process.env.AUTH_COOKIE;

  // create the catalog
  try {
    await createCatalog(testConfiguration, projectNames, options.manualTestConfig);
  } catch (exp) {
    throw exp;
  }

  // take care of chaise-config
  copyChaiseConfig(options.chaiseConfigFilePath);

  registerCallbacks(testConfiguration);
}

/**
 * on CI:
 *  - make sure dummy username/pass work
 *  - populate the AUTH_COOKIE_ID and RESTRICTED_AUTH_COOKIE_ID
 * local:
 *  - make sure AUTH_COOKIE and RESTRICTED_AUTH_COOKIE are valid
 *  - populate the AUTH_COOKIE_ID and RESTRICTED_AUTH_COOKIE_ID
 */
async function checkUserSessions(): Promise<{ session: any, authCookie: string }> {
  return new Promise((resolve, reject) => {
    let result: { session: any, authCookie: string };
    if (process.env.CI) {
      getSessionByUserPass('test1', 'dummypassword', 'AUTH_COOKIE').then((res) => {
        result = res;
        return getSessionByUserPass('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE');
      }).then(() => {
        resolve(result);
      }).catch((err) => reject(err));
    } else {
      const authCookie = process.env.AUTH_COOKIE;
      const restrictedAuthCookie = process.env.RESTRICTED_AUTH_COOKIE;

      if (!authCookie || !restrictedAuthCookie) {
        reject(new Error('AUTH_COOKIE and RESTRICTED_AUTH_COOKIE env variables are required.'));
        return;
      }

      getSessionByCookie(authCookie, 'AUTH_COOKIE').then((res) => {
        result = res;
        return getSessionByCookie(restrictedAuthCookie, 'RESTRICTED_AUTH_COOKIE');
      }).then(() => {
        resolve(result);
      }).catch((err) => reject(err));
    }
  });
}

/**
 * create the catalog and data
 */
async function createCatalog(testConfiguration: any, projectNames: string[], isManual?: boolean) {

  return new Promise(async (resolve, reject) => {
    testConfiguration.setup.url = process.env.ERMREST_URL;
    testConfiguration.setup.authCookie = testConfiguration.authCookie;

    const schemaConfigurations = testConfiguration.setup.schemaConfigurations;
    if (!Array.isArray(schemaConfigurations) || schemaConfigurations.length === 0) {
      reject(new Error('No schemaConfiguration provided in testConfiguration.setup.'));
      return;
    }

    // find the actual content instead of file path
    for (let i = 0; i < schemaConfigurations.length; i++) {
      const schemaConfig = schemaConfigurations[i];
      if (typeof schemaConfig === 'string') {
        if (isManual) {
          schemaConfigurations[i] = require(`${process.env.PWD}/test/manual/data_setup/config/${schemaConfig}`);
        } else {
          schemaConfigurations[i] = require(`${process.env.PWD}/test/e2e/data_setup/config/${schemaConfig}`);
        }
      }
    }

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

    for (const p of projectNames) {
      try {
        const res = await setupCatalog({ catalog, schemas });
        console.log(`catalog with id ${res.catalogId} created for project ${p}`);
        setCatalogID(p, res.catalogId);

        // TODO capture entities per project
        // const entities = res.entities;
        // fs.writeFile(ENTITIES_PATH, JSON.stringify(entities), 'utf8', function (err) {
        //   if (err) {
        //     console.log('couldn\'t write entities.');
        //     console.log(err);
        //     reject(new Error('Unable to import data'));
        //   } else {
        //     console.log('created entities file for schemas');
        //     resolve(true);
        //   }
        // });

      } catch (exp) {
        console.log(exp);
        reject(new Error('Unable to import data'));
        return;
      }
    }

    resolve(true);

  });

}


/**
 * send a request with the given cookie to authn and retreive the session object.
 */
async function getSessionByCookie(cookie: string, authCookieEnvName: string): Promise<{ session: any, authCookie: string }> {
  return new Promise(async (resolve, reject) => {

    try {
      const response = await axios({
        url: process.env.ERMREST_URL!.replace('ermrest', 'authn') + '/session',
        method: 'GET',
        headers: {
          'Cookie': cookie
        }
      });

      console.log(`retrieved session info for ${authCookieEnvName}`);

      // populate the _ID env variable that is used during testing
      process.env[authCookieEnvName + '_ID'] = response.data.client.id;

      resolve({ session: response.data, authCookie: cookie });
    } catch (exp) {
      console.log(`Unable to retreive session info for ${authCookieEnvName}`);
      reject(exp);
    }

  });
}

/**
 * sends a request to webauthn with the given username and pass and return the session object.
 * useful in CI. it will take care of the following:
 * - set the `_ID` env variable so later can be used for tests.
 * - get the client object
 *
 * @param username
 * @param password
 * @param authCookieEnvName
 */
async function getSessionByUserPass(username: string, password: string, authCookieEnvName: string): Promise<{ session: any, authCookie: string }> {
  return new Promise(async (resolve, reject) => {

    try {
      const response = await axios({
        url: process.env.ERMREST_URL!.replace('ermrest', 'authn') + '/session',
        method: 'POST',
        data: 'username=' + username + '&password=' + password
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const autnCookieObj = require('set-cookie-parser').parse(response).filter((c: any) => c.name === 'webauthn')[0];
      if (autnCookieObj) {
        const authCookie = autnCookieObj.name + '=' + autnCookieObj.value + ';';

        // attach the cookie to env variables
        process.env[authCookieEnvName] = authCookie;

        // user id
        process.env[authCookieEnvName + '_ID'] = response.data.client.id;

        console.log(`retrieved session info for ${username}`);
        resolve({ session: response.data, authCookie });
      } else {
        throw new Error('cookie not found in the response.');
      }
    } catch (exp) {
      console.log(`Unable to retreive session info for ${authCookieEnvName}`);
      reject(exp);
    }

  });
}

/**
 * copy the chaise config into desired location
 */
function copyChaiseConfig(chaiseConfigFilePath?: string) {
  let chaiseFilePath = 'chaise-config-sample.js';
  if (typeof chaiseConfigFilePath === 'string') {
    try {
      fs.accessSync(process.env.PWD + '/' + chaiseConfigFilePath);
      chaiseFilePath = chaiseConfigFilePath;
    } catch (e) {
      console.log(`Config file ${chaiseConfigFilePath} doesn't exists`);
    }
  }

  const remoteChaiseDirPath = process.env.REMOTE_CHAISE_DIR_PATH;

  // The tests will take this path when it is not running on CI and remoteChaseDirPath is not null
  let cmd;
  if (typeof remoteChaiseDirPath === 'string') {
    cmd = `scp ${chaiseFilePath} ${remoteChaiseDirPath}/chaise-config.js`;
    console.log('Copying using scp');
  } else {
    cmd = `sudo cp ${chaiseFilePath} /var/www/html/chaise/chaise-config.js`;
    console.log('Copying using cp');
  }

  try {
    execSync(cmd);
    console.log(`Copied file ${chaiseFilePath} successfully to chaise-config.js \n`);
  } catch (exp) {
    console.log(exp);
    console.log(`Unable to copy file ${chaiseFilePath} to chaise-config.js \n`);
    process.exit(1);
  }
}

// TODO test these
let catalogDeleted = false;
function registerCallbacks(testConfiguration: any) {
  // If an uncaught exception is caught then simply call cleanup
  // to remove the created schema/catalog/tables if catalogId is not null
  process.on('uncaughtException', function (err) {
    console.dir(err);
    console.log('uncaughtException: going to remove all catalogs.');
    const cb = () => {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
      console.error(err.stack);
      process.exit(1)
    };

    if (catalogDeleted) {
      console.log('catalogs are already deleted');
      cb();
      return;
    }

    if (testConfiguration.cleanup) {
      catalogDeleted = true;
      removeAllCatalogs().then(cb, cb);
    } else {
      cb();
    }

  });

  process.on('SIGINT', function () {
    if (!catalogDeleted) {
      catalogDeleted = true;
      console.log('SIGINT: going to remove all catalogs.');
      removeAllCatalogs().then(function () {
        process.exit(1);
      });
    } else {
      console.log('SIGINT: catalogs are already deleted.');
      process.exit(1);
    }
  });
}
