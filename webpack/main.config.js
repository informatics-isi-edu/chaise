/* eslint-disable @typescript-eslint/no-var-requires */

const getAppConfig = require('./app.config');
const getLibConfig = require('./lib.config');

// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) == -1) {
  mode = nodeDevs[0];
}

console.log(`webpack mode: ${mode}`);

module.exports = (env) => [
  // chaise apps:
  getAppConfig('recordset', 'Recordset', mode, env),

  // chaise libs:
  getLibConfig('navbar', mode, env),
];
