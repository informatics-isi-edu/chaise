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
          `${chaisePath}google-dataset-config.js`,
          `${chaisePath}config/google-dataset-config.js`
        ]
      },
      {
        appName: 'recordedit',
        appTitle: 'Recordedit',
        externalFiles: [...recordsetExtFiles]
      },
      {
        appName: 'viewer',
        appTitle: 'Image Viewer',
        externalFiles: [
          ...recordsetExtFiles,
          `${chaisePath}viewer/viewer-config.js`,
          `${chaisePath}config/viewer-config.js`
        ]
      },
      {
        appName: 'help',
        appTitle: 'Wiki Pages',
      },
      {
        appName: 'navbar',
        bundleName: 'navbar-lib',
        appTitle: 'Navbar standalone library',
        isLib: true,
        /**
         * navbar -> snapshot-dropdown -> input-switch -> recordset (fk) -> plotly
         */
        externalFiles: [...recordsetExtFiles]
      },
      {
        appName: 'login',
        bundleName: 'login-lib',
        appTitle: 'Login standalone library',
        isLib: true
      }
    ],
    mode,
    env,
    {
      extraWebpackProps: {
        externals: {
          // treat plotly as an external dependency and don't compute it
          'plotly.js-basic-dist-min': 'Plotly'
        }
      }
    }
  );
}
