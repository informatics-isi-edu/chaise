const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require("terser-webpack-plugin");
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
          filename: '[name].bundle.js'
      },
      resolve: {
          extensions: ['.ts', '.tsx', '.js'],
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
              {
                  test: /\.(ts|js)x?$/,
                  exclude: /node_modules/,
                  use: ['babel-loader'],
              },
              {
                test: /\.(css|scss)$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
              },
              {
                test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
                type: 'asset/resource',
              },
              {
                test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
                type: 'asset/inline',
              }
          ]
      },
      plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
          template: path.join(__dirname, '..', 'src', 'pages', 'main.html'),
        }),
      ],
      optimization: {
        splitChunks: {
          chunks: 'all',
        }
      }
  }
}
