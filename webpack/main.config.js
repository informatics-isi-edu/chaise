/* eslint-disable @typescript-eslint/no-var-requires */

const getAppConfig = require('./app.config');
const getLibConfig = require('./lib.config');

// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) === -1) {
  mode = nodeDevs[0];
}

module.exports = (env) => {
  const chaisePath = env.BUILD_VARIABLES.CHAISE_BASE_PATH;

  return [
    // chaise apps:
    getAppConfig('login', 'Login', mode, env),
    getAppConfig('recordset', 'Recordset', mode, env, {
      external_files: [`${chaisePath}vendor/plotly-basic.min.js`]
    }),

    // chaise libs:
    // TODO should be updated and tested before adding it back:
    // getLibConfig('navbar', mode, env),
  ];
};
