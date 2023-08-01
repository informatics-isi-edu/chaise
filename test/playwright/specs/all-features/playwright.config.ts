// eslint-disable-next-line no-restricted-imports
import getConfig from '../../utils/playwright.configuration';

export default getConfig({
  configFileName: 'parallel-configs/all-features.dev.json',
  chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js',
});
