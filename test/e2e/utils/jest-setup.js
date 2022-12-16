import 'regenerator-runtime/runtime';
const { setup: setupPuppeteer } = require('jest-environment-puppeteer')

module.exports = async (globalConfig) => {
  await setupPuppeteer(globalConfig);

  console.log('doing the presetup!');

  globalThis.__PARAMS__ = {
    whatever: 'yes'
  }
}
