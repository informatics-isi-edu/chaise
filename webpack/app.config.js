/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');

/**
 * Return the webpack config object that can be used for creating chaise-app/lib bundles
 * appConfigs is an array of objects with the following required props:
 *   - appName: the name of the app. used to find the <appName>.tsx associated with it
 * and the following optional props:
 *   - appTitle: (string) Added to the default title tag.
 *   - bundleName: (string) if defined, will be used to name the bundle. Otherwise we will use appName.
 *   - externalFiles: (array of strings) the extra files that we should add script tag for
 *   - appConfigLocation: (string) the app-specific config file that we should add script tag for
 *   - isLib: (boolean) whether this is a library or an app.
 *
 * env variables that are required for calling this function:
 * - BUILD_VARIABLES: An object with the following properties:
 * - ERMRESTJS_BASE_PATH: The base path of ermrestjs in the server, e.g. /ermrestjs/
 * - CHAISE_BASE_PATH: The base path of chaise in the server, e.g. /chaise/
 * - BUILD_VERSION: A randomly generated string signifying the build version.
 *
 * @param {Object} appConfigs
 *  the app configurations
 * @param {'development'|'production'} mode
 * @param {Object} env the environment variables
 * @param {{pathPrefix?: string, pathAliases?: Object}?} options optional parameter to modify the prefix and alaises
 * @returns the webpack config
 */
const getWebPackConfig = (appConfigs, mode, env, options) => {
  const ermrestjsPath = env.BUILD_VARIABLES.ERMRESTJS_BASE_PATH;
  const chaisePath = env.BUILD_VARIABLES.CHAISE_BASE_PATH;
  const buildVersion = env.BUILD_VARIABLES.BUILD_VERSION;
  const isDevMode = (mode === 'development');

  options = options || {};
  if (typeof options.pathPrefix !== 'string' || options.pathPrefix.length === 0) {
    options.pathPrefix = path.resolve(__dirname, '..');
  }
  if (!options.pathAliases || typeof options.pathAliases !== 'object') {
    options.pathAliases = {};
  }

  const entries = {}, appHTMLPlugins = [];

  // define entries and add plugins based on appConfigs
  appConfigs.forEach((ac) => {
    const bundleName = ac.bundleName || ac.appName;

    // create the entry
    entries[bundleName] = {
      import: path.join(options.pathPrefix, 'src', ac.isLib ? 'libs' : 'pages', `${ac.appName}.tsx`)
    };

    // script tags that will be injected directly to the page
    const externalFiles = [
      // ermrestjs
      `${ermrestjsPath}ermrest.vendor.min.js?v=${buildVersion}`,
      `${ermrestjsPath}ermrest.min.js?v=${buildVersion}`,
      // chaise-config
      `${chaisePath}chaise-config.js?v=${buildVersion}`,
      // the specific app config file
      ...ac.appConfigLocation ? [`${ac.appConfigLocation}?v=${buildVersion}`] : [],
      // external files that the app might need
      ...Array.isArray(ac.externalFiles) ? ac.externalFiles.map((f) => `${f}?v=${buildVersion}`) : []
    ];

    // create the html plugin
    appHTMLPlugins.push(
      new HtmlWebpackPlugin({
        chunks: [bundleName],
        template: path.join(__dirname, 'templates', ac.isLib ? 'lib.html' : 'app.html'),
        // the filename path is relative to the "output" define below which is the "bundles" folder.
        // we want the libs to be inside the lib folder so they don't clash with apps
        filename: `../${ac.isLib ? 'lib/' : ''}${ac.appName}/index.html`,
        // in lib mode, we are manually controlling the injection
        inject: ac.isLib ? false : true,
        // scriptLoading: ac.isLib ? 'blocking' : 'defer',
        app_name: ac.appName,
        title: ac.appTitle,
        external_files: externalFiles.map((f) => `<script src="${f}"></script>`).join('\n'),
      })
    );

    if (ac.isLib) {
      // the javascript file that can be used to dynamically load the dependencies
      appHTMLPlugins.push(
        new HtmlWebpackPlugin({
          chunks: [bundleName],
          template: path.join(__dirname, 'templates', 'dynamic-load.js'),
          // the filename path is relative to the "output" define below which is the "bundles" folder.
          // we want the libs to be inside the lib folder so they don't clash with apps
          filename: `../lib/${ac.appName}/${ac.appName}.includes.js`,
          // we don't want webpack to inject assets automatically
          inject: false,
          // in this mode, we want the string version so we can append the webpack files to it
          external_files: JSON.stringify(externalFiles)
        })
      );
    }
  });

  return {
    devtool: isDevMode ? 'inline-source-map' : false,
    mode,
    entry: entries,
    output: {
      // we're outputting generated files into a separate bundles folder
      // so we have full control over it on the server and can replace the whole
      // file if we want to (using rsync --delete)
      path: path.resolve(options.pathPrefix, 'dist', 'react', 'bundles'),
      // contenthash will help with avoiding to send unchanged files to server
      filename: '[name].[contenthash].js',
      clean: true,
      // the path that will be prepended to the output css and js files
      // we're defining this to ensure absolute paths instead of relative
      publicPath: `${chaisePath}bundles/`
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        ...options.pathAliases,
        // the line below will make sure we can include chaise files using the package full name
        '@isrd-isi-edu/chaise': path.resolve(__dirname, '..')
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          use: ['babel-loader'],
        },
        {
          test: /\.(css|scss)$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
          // cue up for tree shake
          sideEffects: true
        },
        {
          test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[base][query]'
          }
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[base][query]'
          }
        },
      ],
    },
    plugins: [
      ...appHTMLPlugins,
      new webpack.DefinePlugin({
        // make sure to use the proper mode (even if the env variable is not defined)
        'process.env.NODE_ENV': JSON.stringify(mode),
        // create a global variable for the build variables
        CHAISE_BUILD_VARIABLES: JSON.stringify(env.BUILD_VARIABLES),
      }),
      new MiniCssExtractPlugin({
        // contenthash will help with avoiding to send unchanged files to server
        filename: '[name].[contenthash].css'
      })
    ],
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        name: 'common',
        cacheGroups: {
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-bootstrap)[\\/]/,
            name: 'vendor-react',
            chunks: 'all',
          },
          bootstrapVendor: {
            test: /[\\/]node_modules[\\/](bootstrap)[\\/]/,
            name: 'vendor-bootstrap',
            chunks: 'all',
          },
          vendor: {
            test: /[\\/]node_modules[\\/]((?!(react|react-dom|react-bootstrap|bootstrap)).*)[\\/]/,
            name: 'vendor-rest',
            chunks: 'all',
          },
        },
      },
    },
    externals: {
      // treat plotly as an external dependency and don't compute it
      'plotly.js-basic-dist-min': 'Plotly'
    },
    performance: {
      assetFilter: (assetFilename) => {
        // ignore the fonts
        return !/\.(woff(2)?|eot|ttf|otf|svg|)$/.test(assetFilename);
      }
    }
  }
}

module.exports = { getWebPackConfig };
