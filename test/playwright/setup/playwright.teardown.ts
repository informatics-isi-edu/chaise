import { FullConfig } from '@playwright/test';
import fs from 'fs';

import { TestOptions } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.model';
import { removeAllCatalogs } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.import';
import { ENTITIES_PATH } from '@isrd-isi-edu/chaise/test/playwright/setup/playwright.parameters';

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
  //   promises.push(pImport.deleteHatracNamespaces(testConfiguration.authCookie, testConfiguration.hatracNamespaces));
  // }

  // remove the created catalogs
  if (testConfiguration.cleanup && testConfiguration.setup) {
    await removeAllCatalogs();
  }

  // TODO
  // delete the entities file
  // fs.unlinkSync(ENTITIES_PATH);

}

export default globalTeardown;
