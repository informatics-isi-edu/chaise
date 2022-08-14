/* eslint-disable @typescript-eslint/no-var-requires */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

/**
 * This function can be used for configuring webpack for installing chaise-like
 * applications. This function must be called with the following environment variables:
 * - BUILD_VARIABLES: An object with the following properties:
 *   - ERMRESTJS_BASE_PATH: The base path of ermrestjs in the server, e.g. /ermrestjs/
 *   - CHAISE_BASE_PATH: The base path of chaise in the server, e.g. /chaise/
 *   - BUILD_VERSION: A randomly generated string signifying the build version.
 *
 * @param {string} appName the filename of the app
 * @param {string} title the title that will be appenede to the HTML
 * @param {string}} mode whether it's in dev mode or production
 * @param {Object} env the environment variables
 * @param {Object?} options the customization options
 * @returns
 */
module.exports = (appName, title, mode, env, options) => {
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

  let app_config = '';
  if (typeof options.appConfigLocation === 'string' && options.appConfigLocation.length > 0) {
    app_config = `<script src='${options.appConfigLocation}?v=${buildVersion}'></script>`;
  }

  let external_files = '';
  if (Array.isArray(options.external_files)) {
    external_files = options.external_files.reduce((prev, curr) => {
      return `${prev}<script src='${curr}?v=${buildVersion}'></script>\n`
    }, '')
  }

  return {
    name: appName,
    devtool: (mode === 'development') ? 'inline-source-map' : false,
    mode,
    entry: path.join(options.pathPrefix, 'src', 'pages', `${appName}.tsx`),
    output: {
      path: path.resolve(options.pathPrefix, 'dist', 'react', appName),
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
      new webpack.DefinePlugin({
        // make sure to use the proper mode (even if the env variable is not defined)
        'process.env.NODE_ENV': JSON.stringify(mode),
        // create a global variable for the build variables
        CHAISE_BUILD_VARIABLES: JSON.stringify(env.BUILD_VARIABLES),
      }),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, '..', 'src', 'pages', 'main.html'),
        app_name: appName,
        title,
        ermrestjs: [
          `<script src='${ermrestjsPath}ermrest.vendor.min.js?v=${buildVersion}'></script>`,
          `<script src='${ermrestjsPath}ermrest.min.js?v=${buildVersion}'></script>`,
        ].join('\n'),
        chaise_config: `<script src='${chaisePath}chaise-config.js?v=${buildVersion}'></script>`,
        app_config,
        external_files
      }),
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
  };
};
