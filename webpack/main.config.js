/* eslint-disable @typescript-eslint/no-var-requires */

const { getWebPackConfig } = require('./app.config');

// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) === -1) {
  mode = nodeDevs[0];
}

module.exports = (env) => {
  const chaisePath = env.BUILD_VARIABLES.CHAISE_BASE_PATH;

  const recordsetExtFiles = [`${chaisePath}bundles/plotly-basic.min.js`];

  return getWebPackConfig(
    [
      {
        appName: 'login',
        appTitle: 'Login',
      },
      {
        appName: 'recordset',
        appTitle: 'Recordset',
        externalFiles: [...recordsetExtFiles]
      },
      {
        appName: 'record',
        appTitle: 'Record',
        externalFiles: [
          ...recordsetExtFiles,
          `${chaisePath}google-dataset-config.js`
        ]
      }
    ],
    mode,
    env
  );
}
