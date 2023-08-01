import { FullConfig } from '@playwright/test';
import axios from 'axios';
import { exec, execSync } from 'child_process';
import fs from 'fs';

export default async function globalSetup(config: FullConfig) {
  console.log('doing global setup');

  /**
   * the only way to pass config to here is using the env variables
   */
  let options: any = process.env.PLAYWRIGHT_TEST_OPTIONS;
  options = typeof options === 'string' ? JSON.parse(options) : {};
  if (typeof options !== 'object') {
    options = {};
  }
  console.log(options);

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
    console.log(exp);
    return;
  }

  // set the cookie for the configuration that will be passed to ermrest-data-utils
  if (process.env.AUTH_COOKIE) {
    testConfiguration.authCookie = process.env.AUTH_COOKIE;
  }


  // create the catalog
  try {
    await setupCatalog(testConfiguration);
  } catch (exp) {
    console.log(exp);
    return;
  }

  // take care of chaise-config
  copyChaiseConfig(options.chaiseConfigFilePath);

}

/**
 * on CI:
 *  - get the host name
 *  - make sure dummy username/pass work
 *  - populate the AUTH_COOKIE_ID and RESTRICTED_AUTH_COOKIE_ID
 * local:
 *  - make sure AUTH_COOKIE and RESTRICTED_AUTH_COOKIE are valid
 *  - populate the AUTH_COOKIE_ID and RESTRICTED_AUTH_COOKIE_ID
 */
async function checkUserSessions() {
  return new Promise((resolve, reject) => {
    if (process.env.CI) {
      exec('hostname', async function (error, stdout, stderr) {

        process.env.ERMREST_URL = 'http://' + stdout.trim() + '/ermrest';
        process.env.CHAISE_BASE_URL = 'http://' + stdout.trim() + '/chaise';

        console.log('ERMrest url is ' + process.env.ERMREST_URL);

        try {
          console.log('getting test1 user info');
          await getSessionByUserPass('test1', 'dummypassword', 'AUTH_COOKIE');
          console.log('getting test2 user info');
          await getSessionByUserPass('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE')

          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      const authCookie = process.env.AUTH_COOKIE;
      const restrictedAuthCookie = process.env.RESTRICTED_AUTH_COOKIE;

      if (!authCookie || !restrictedAuthCookie) {
        reject('AUTH_COOKIE and RESTRICTED_AUTH_COOKIE env variables are required.');
        return;
      }

      console.log('testing AUTH_COOKIE and RESTRICTED_AUTH_COOKIE');
      getSessionByCookie(authCookie, 'AUTH_COOKIE').then((res) => {
        // set the session information to be parsed later
        process.env.WEBAUTHN_SESSION = JSON.stringify(res);

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
async function setupCatalog(testConfiguration: any) {
  //
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
