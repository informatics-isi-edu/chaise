/* eslint-disable @typescript-eslint/no-var-requires */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

// TODO should be updated based on changes in app.config.js

module.exports = function (libName, mode) {
  return {
    name: libName,
    devtool: (mode === 'development') ? 'inline-source-map' : false,
    mode,
    entry: path.join(__dirname, '..', 'src', 'libs', `${libName}.tsx`),
    output: {
      path: path.resolve(__dirname, '..', 'dist', 'react', libName),
      filename: 'navbar.bundle.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: [
        path.resolve(__dirname, '..', 'src'),
        path.resolve(__dirname, '..', 'node_modules'),
      ],
      alias: {
        '@isrd-isi-edu/chaise': path.resolve(__dirname, '..')
      },
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
          type: 'asset/inline',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        // template: path.join(__dirname, '..', 'src', 'pages', 'main.html'),
      }),
    ],
  };
};
