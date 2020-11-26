'use strict'

const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const ESLintPlugin = require('eslint-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const path = require('path')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  mode: 'production',
  // index.js is standard, so setting the entry is not required
  // entry: [
  //     './src/index.js'
  // ],
  output: {
    publicPath: '/static/app',
    path: resolve('dist/static/app')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }, {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }, {
        test: /\.styl(us)?$/,
        use: [
          'vue-style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'stylus-loader'
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __API_PATH__: JSON.stringify('/public')
    }),
    new MiniCssExtractPlugin({
      filename: 'main.css'
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      filename: resolve('dist/index.html'),
      template: 'index.html',
      inject: true,
      favicon: resolve('static/img/favicon.png')
    }),
    // new ESLintPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
        from: resolve('static/img'),
        to: resolve('dist/static/img'),
        toType: 'dir'
      }]
    }),
    new CompressionWebpackPlugin()
  ]
}
