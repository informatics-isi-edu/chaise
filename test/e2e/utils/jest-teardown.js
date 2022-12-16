import 'regenerator-runtime/runtime';
const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer')

module.exports = async (globalConfig) => {
  console.log('doing the teardown!');

  await teardownPuppeteer(globalConfig);
};
