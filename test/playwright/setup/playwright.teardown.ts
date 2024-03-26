import { FullConfig } from '@playwright/test';
import fs from 'fs';

import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import { removeAllCatalogs } from '@isrd-isi-edu/chaise/test/playwright/utils/catalog-utils';
import { ENTITIES_PATH } from '@isrd-isi-edu/chaise/test/playwright/utils/constants';
import axios from 'axios';

async function globalTeardown(config: FullConfig) {
  /**
   * the only way to pass config to here is using the env variables
   */
  let optionsEnv = process.env.PLAYWRIGHT_TEST_OPTIONS;
  optionsEnv = typeof optionsEnv === 'string' ? JSON.parse(optionsEnv) : {};
  if (typeof optionsEnv !== 'object') {
    throw new Error('test options was not passed to the global setup.');
  }

  const options: TestOptions = optionsEnv;

  let testConfiguration;
  if (options.configFileName) {
    if (options.manualTestConfig) {
      testConfiguration = require(`../../manual/data_setup/config/${options.configFileName}`);
    } else {
      testConfiguration = require(`../../e2e/data_setup/config/${options.configFileName}`);
    }
  }

  // TODO
  // if (testConfiguration.hatracNamespaces && testConfiguration.hatracNamespaces.length > 0) {
  //   // cleanup the hatrac namespaces
  //   for (const ns of testConfiguration.hatracNamespaces) {
  //     const response = await axios(ns, { method: 'DELETE', headers: { Cookie: process.env.AUTH_COOKIE! } });
  //   }
  // }

  // remove the created catalogs
  if (testConfiguration.cleanup && testConfiguration.setup) {
    await removeAllCatalogs();
  }

  // delete the entities file
  try {
    fs.unlinkSync(ENTITIES_PATH);
  } catch (exp) { }

}

export default globalTeardown;
