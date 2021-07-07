const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

module.exports =  function (appName, filename) {
  filename = filename || appName;
  return {
      name: appName,
      devtool: 'source-map',
      mode: process.env.NODE_ENV || 'production',
      entry: path.join(__dirname, '..', 'src', 'pages', filename + '.tsx'),
      output: {
          path: path.resolve(__dirname, '..', 'dist', 'react', filename),
          filename: appName + '.bundle.js'
      },
      resolve: {
          extensions: ['.ts', '.tsx', '.js', '.json'],
          modules: [
              path.resolve(__dirname, '..', 'src'),
              path.resolve(__dirname, '..', 'node_modules')
          ],
          alias: {
              Assets: path.resolve(__dirname, '..', 'src', 'assets'),
              Components: path.resolve(__dirname, '..', 'src', 'components'),
              Legacy: path.resolve(__dirname, '..'),
              Services: path.resolve(__dirname, '..', 'src', 'services'),
              Store: path.resolve(__dirname, '..', 'src', 'store'),
              Utils: path.resolve(__dirname, '..', 'src', 'utils'),
              Vendor: path.resolve(__dirname, '..', 'src', 'vendor')
          }
      },
      module: {
          rules: [
              // {
                  // Include ts, tsx, js, and jsx files.
                  // test: /\.(ts|js)x?$/,
              //     test: /\.(js|jsx)$/,
              //     exclude: /node_modules/,
              //     use: ['babel-loader']
              // },
              {
                  test: /\.(ts|js)x?$/,
                  exclude: /node_modules/,
                  use: ['ts-loader'],
              }
              // {
              //     test: /\.(css|scss)$/,
              //     use: ['style-loader', 'css-loader', 'sass-loader'],
              // }
          ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: path.join(__dirname, '..', 'src', 'pages', 'main.html'),
        }),
      ],
      // optimization: {
      //     minimize: true,
      //     minimizer: [
      //         new TerserPlugin({
      //             // Use multi-process parallel running to improve the build speed
      //             // Default number of concurrent runs: os.cpus().length - 1
      //             parallel: true
      //         })
      //     ]
      // }
  }
}
