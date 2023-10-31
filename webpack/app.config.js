/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');

/**
 * Return the webpack config object that can be used for creating chaise-app/lib bundles
 *
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
 * options props:
 * - urlBasePath: the base path of accessing the app (e.g. /chaise/ or /deriva-webapps/).
 *                if missing, we will use CHAISE_BASE_PATH.
 * - rootFolderLocation: the location of root folder. used to find the code (e.g. ../src)
 * - resolveAliases: the aliases that will be used in import statements.
 *
 * @param {Object} appConfigs
 *  the app configurations
 * @param {'development'|'production'} mode
 * @param {Object} env the environment variables
 * @param {Object?} options optional parameter to modify the prefix and alaises
 * @returns the webpack config
 */
const getWebPackConfig = (appConfigs, mode, env, options) => {
  const isDevMode = (mode === 'development');

  const ermrestjsPath = env.BUILD_VARIABLES.ERMRESTJS_BASE_PATH;
  const chaisePath = env.BUILD_VARIABLES.CHAISE_BASE_PATH;
  const buildVersion = env.BUILD_VARIABLES.BUILD_VERSION;

  options = options || {};

  if (typeof options.urlBasePath !== 'string' || options.urlBasePath.length === 0) {
    options.urlBasePath = chaisePath;
  }
  if (typeof options.rootFolderLocation !== 'string' || options.rootFolderLocation.length === 0) {
    options.rootFolderLocation = path.resolve(__dirname, '..');
  }
  if (!options.resolveAliases || typeof options.resolveAliases !== 'object') {
    options.resolveAliases = {};
  }

  const entries = {}, appHTMLPlugins = [];

  // define entries and add plugins based on appConfigs
  appConfigs.forEach((ac) => {
    const bundleName = ac.bundleName ? ac.bundleName : ac.appName;

    // create the entry
    entries[bundleName] = {
      import: path.join(options.rootFolderLocation, 'src', ac.isLib ? 'libs' : 'pages', `${ac.appName}.tsx`)
    };

    // script tags that will be injected directly to the page
    const externalFiles = [
      // ermrestjs
      `${ermrestjsPath}ermrest.vendor.min.js?v=${buildVersion}`,
      `${ermrestjsPath}ermrest.min.js?v=${buildVersion}`,
      // chaise-config
      `${chaisePath}config/chaise-config.js?v=${buildVersion}`,
      // the specific app config file
      ...ac.appConfigLocation ? [`${ac.appConfigLocation}?v=${buildVersion}`] : [],
      // external files that the app might need
      ...Array.isArray(ac.externalFiles) ? ac.externalFiles.map((f) => `${f}?v=${buildVersion}`) : []
    ];

    // create the html plugin
    appHTMLPlugins.push(
      new HtmlWebpackPlugin({
        /**
         * in case of libraries (navbar, login), we want to make sure the library
         * dependencies are blocking the content so the navbar/login shows up
         * right away instead of being delayed with the rest of the content.
         */
        scriptLoading: ac.isLib ? 'blocking' : 'defer',
        chunks: [bundleName],
        template: path.join(__dirname, 'templates', ac.isLib ? 'lib.html' : 'app.html'),
        // the filename path is relative to the "output" define below which is the "bundles" folder.
        // we want the libs to be inside the `lib` folder so they don't clash with apps
        filename: ac.isLib ? `../lib/${ac.appName}/${ac.appName}-dependencies.html` : `../${ac.appName}/index.html`,
        // in lib mode, we are manually controlling the injection
        inject: ac.isLib ? false : true,
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
          filename: `../lib/${ac.appName}/${ac.appName}.dependencies.js`,
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
      path: path.resolve(options.rootFolderLocation, 'dist', 'react', 'bundles'),
      // contenthash will help with avoiding to send unchanged files to server
      filename: '[name].[contenthash].js',
      clean: true,
      // the path that will be prepended to the output css and js files
      // we're defining this to ensure absolute paths instead of relative
      publicPath: `${options.urlBasePath}bundles/`
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        ...options.resolveAliases,
        // the line below will make sure we can include chaise files using the package full name
        '@isrd-isi-edu/chaise': path.resolve(__dirname, '..'),
        /**
         * the line below allows profiling on prod servers.
         *
         * while adding it won't have a significant performance difference, we should only
         * uncomment this during development and should not use it for actual deployment.
         * https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
         */
        // 'react-dom$': 'react-dom/profiling',
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
        filename: '[name].[contenthash].css',
        /**
         * given that we're using CSS modules, this shouldn't cause any issues.
         * The input-switch.scss was causing circular dep issue and this has been
         * added to remove the warning.
         */
        ignoreOrder: true
      })
    ],
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        /**
         * avoid making very small or very large chunks
         */
        minSize: 50000,
        maxSize: 500000,
        hidePathInfo: true,
        name: 'common',
        /**
         * the noted priority is also changing the order of include statements in the output html.
         * we want to make sure chaise is the last css file that is added, that's why it has the lowest priority.
         * this was mainly an issue in deriva-webapps where the bootstrap rules were overriding our chaise rules.
         *
         * TODO we should come up with a better solution. "priority" property is mainly to make sure a rule has
         * precedence over another one. so if two rules match the given "test", the one with higher priority wins.
         * but now we're abusing it to dicatet the order of assets.
         */
        cacheGroups: {
          // this group is useful for deriva-webapps
          chaiseVendor: {
            test: /[\\/]node_modules[\\/]\@isrd-isi-edu[\\/]chaise[\\/]/,
            name: 'vendor-chaise',
            chunks: 'all',
            priority: 1
          },
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-bootstrap)[\\/]/,
            name: 'vendor-react',
            chunks: 'all',
            priority: 2
          },
          bootstrapVendor: {
            test: /[\\/]node_modules[\\/]bootstrap[\\/]/,
            name: 'vendor-bootstrap',
            chunks: 'all',
            priority: 3
          },
          vendor: {
            test: /[\\/]node_modules[\\/](?!(\@isrd-isi-edu[\\/]chaise|bootstrap|react|react-dom|react-bootstrap)[\\/])/,
            name: 'vendor-rest',
            chunks: 'all',
            priority: 4
          }
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
