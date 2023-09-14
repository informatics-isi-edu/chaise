import { FullConfig } from '@playwright/test';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';

import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import { removeCatalog, setupCatalog } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.import';
import { ENTITIES_PATH } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.constant';

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


  // see if the user/pass or cookie are valid
  try {
    await checkUserSessions();
  } catch (exp) {
    throw exp;
  }

  // set the cookie for the configuration that will be passed to ermrest-data-utils
  if (process.env.AUTH_COOKIE) {
    testConfiguration.authCookie = process.env.AUTH_COOKIE;
  }

  // create the catalog
  try {
    await createCatalog(testConfiguration, options.manualTestConfig);
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
async function checkUserSessions() {
  return new Promise((resolve, reject) => {
    if (process.env.CI) {
      console.log('getting test1 user info');
      getSessionByUserPass('test1', 'dummypassword', 'AUTH_COOKIE').then(() => {
        console.log('getting test2 user info');
        return getSessionByUserPass('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE');
      }).then(() => {
        resolve(true);
      }).catch((err) => reject(err));
    } else {
      const authCookie = process.env.AUTH_COOKIE;
      const restrictedAuthCookie = process.env.RESTRICTED_AUTH_COOKIE;

      if (!authCookie || !restrictedAuthCookie) {
        reject('AUTH_COOKIE and RESTRICTED_AUTH_COOKIE env variables are required.');
        return;
      }

      console.log('testing AUTH_COOKIE and RESTRICTED_AUTH_COOKIE');
      getSessionByCookie(authCookie, 'AUTH_COOKIE').then((res) => {
        return getSessionByCookie(restrictedAuthCookie, 'RESTRICTED_AUTH_COOKIE');
      }).then(() => {
        resolve(true);
      }).catch((err) => {
        reject(err);
      });
    }
  });
}

/**
 * create the catalog and data
 */
async function createCatalog(testConfiguration: any, isManual?: boolean) {

  return new Promise((resolve, reject) => {
    testConfiguration.setup.url = process.env.ERMREST_URL;
    testConfiguration.setup.authCookie = testConfiguration.authCookie;

    const schemaConfigurations = testConfiguration.setup.schemaConfigurations;
    if (!Array.isArray(schemaConfigurations) || schemaConfigurations.length === 0) {
      reject('No schemaConfiguration provided in testConfiguration.setup.');
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

    setupCatalog(schemaConfigurations).then((data: any) => {
      process.env.CATALOG_ID = data.catalogId;
      if (data.entities) {
        const entities = data.entities;
        fs.writeFile(ENTITIES_PATH, JSON.stringify(entities), 'utf8', function (err) {
          if (err) {
            console.log('couldn\'t write entities.');
            console.log(err);
            reject(new Error('Unable to import data'));
          } else {
            console.log('created entities file for schemas');
            resolve(true);
          }
        });

      } else {
        resolve(true);
      }

    }, function (err) {
      console.log(err);
      reject(new Error('Unable to import data'));
    });

  });

}

async function getSessionByCookie(cookie: string, authCookieEnvName: string) {
  new Promise(async (resolve, reject) => {

    try {
      const response = await axios({
        url: process.env.ERMREST_URL!.replace('ermrest', 'authn') + '/session',
        method: 'GET',
        headers: {
          'Cookie': cookie
        }
      });

      if (authCookieEnvName === 'AUTH_COOKIE') {
        // set the session information to be parsed later
        process.env.WEBAUTHN_SESSION = JSON.stringify(response.data);
      }

      process.env[authCookieEnvName + '_ID'] = response.data.client.id;

      resolve(response.data);
    } catch (exp) {
      reject(`nable to retreive userinfo for ${authCookieEnvName}`);
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
async function getSessionByUserPass(username: string, password: string, authCookieEnvName: string) {
  new Promise(async (resolve, reject) => {

    axios({
      url: process.env.ERMREST_URL!.replace('ermrest', 'authn') + '/session',
      method: 'POST',
      data: 'username=' + username + '&password=' + password
    }).then((response) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cookies = require('set-cookie-parser').parse(response);
      cookies.forEach(function (c: any) {
        // auth cookie env variable
        if (c.name === 'webauthn') {
          if (authCookieEnvName === 'AUTH_COOKIE') { // main user
            process.env.AUTH_COOKIE = c.name + '=' + c.value + ';';
            // set the session information to be parsed later
            process.env.WEBAUTHN_SESSION = JSON.stringify(response.data);
          }
          // webauthn cookie
          process.env[authCookieEnvName] = c.name + '=' + c.value + ';';
        }
      });

      if (process.env[authCookieEnvName]) {
        // user id
        process.env[authCookieEnvName + '_ID'] = response.data.client.id;
        resolve(true);
      } else {
        reject('Unable to retreive ' + authCookieEnvName);
      }
    }).catch((error) => {
      console.dir('Unable to retreive ' + authCookieEnvName);
      reject(error);
    });

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
    const catalogId = process.env.CATALOG_ID;
    console.log(`in error : catalogId ${catalogId}`);
    console.dir(err);
    const cb = () => {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
      console.error(err.stack);
      process.exit(1)
    };

    if (!catalogDeleted && testConfiguration.cleanup && catalogId != null) {
      removeCatalog(catalogId).then(cb, cb);
    } else {
      cb();
    }

  });

  process.on('SIGINT', function (code) {
    console.log('sigint!!!');

    const catalogId = process.env.CATALOG_ID;
    if (!catalogId) {
      return;
    }

    if (!catalogDeleted) {
      catalogDeleted = true;
      console.log('About to exit because of SIGINT (ctrl + c)');
      removeCatalog(catalogId).then(function () {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}
