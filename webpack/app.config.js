/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');

/**
 * Return the webpack config object that can be used for creating chaise-app/lib bundles
 * env variables that are required for calling this function:
 * - BUILD_VARIABLES: An object with the following properties:
 * - ERMRESTJS_BASE_PATH: The base path of ermrestjs in the server, e.g. /ermrestjs/
 * - CHAISE_BASE_PATH: The base path of chaise in the server, e.g. /chaise/
 * - BUILD_VERSION: A randomly generated string signifying the build version.
 *
 * @param {Array.<{appName:string, bundleName?:string, appConfigLocation?: string, externalFiles?: string[]}>} appConfigs
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
      import: path.join(options.pathPrefix, 'src', 'pages', `${ac.appName}.tsx`)
    };

    const appConfig = ac.appConfigLocation ? `<script src='${ac.appConfigLocation}?v=${buildVersion}'></script>` : '';

    let externalFiles = '';
    if (Array.isArray(ac.externalFiles)) {
      externalFiles = ac.externalFiles.reduce((prev, curr) => {
        return `${prev}<script src='${curr}?v=${buildVersion}'></script>\n`
      }, '')
    }

    // create the html plugin
    appHTMLPlugins.push(
      new HtmlWebpackPlugin({
        template: path.join(__dirname, '..', 'src', 'pages', 'main.html'),
        filename: `../${ac.appName}/index.html`,
        app_name: ac.appName,
        title: ac.appTitle,
        ermrestjs: [
          `<script src='${ermrestjsPath}ermrest.vendor.min.js?v=${buildVersion}'></script>`,
          `<script src='${ermrestjsPath}ermrest.min.js?v=${buildVersion}'></script>`,
        ].join('\n'),
        chaise_config: `<script src='${chaisePath}chaise-config.js?v=${buildVersion}'></script>`,
        app_config: appConfig,
        external_files: externalFiles,
        chunks: [bundleName]
      })
    )

  });

  return {
    devtool: (mode === 'development') ? 'inline-source-map' : false,
    mode,
    entry: entries,
    output: {
      path: path.resolve(options.pathPrefix, 'dist', 'react', 'bundles'),
      // filename: '[name].[contenthash].bundle.js',
      filename: '[name].bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        ...options.pathAliases,
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
          sideEffects: true,
        },
        {
          test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
          // this will make sure the fonts are part of the css
          // type: 'asset/inline',
          type: 'asset/resource',
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
      new MiniCssExtractPlugin()
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    externals: {
      // treat plotly as an external dependency and don't compute it
      'plotly.js-basic-dist-min': 'Plotly'
    },
  }
}

module.exports = { getWebPackConfig };
