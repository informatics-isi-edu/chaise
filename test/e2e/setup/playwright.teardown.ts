import { FullConfig } from '@playwright/test';
import fs from 'fs';

import { TestOptions } from '@isrd-isi-edu/chaise/test/e2e/setup/playwright.model';
import { removeAllCatalogs } from '@isrd-isi-edu/chaise/test/e2e/utils/catalog-utils';
import { ENTITIES_PATH } from '@isrd-isi-edu/chaise/test/e2e/utils/constants';

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
