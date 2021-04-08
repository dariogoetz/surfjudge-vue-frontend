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
  entry: [
    './src/index-admin.js'
  ],
  output: {
    publicPath: '/static/app-admin',
    path: resolve('dist/static/app-admin')
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
      __API_PATH__: JSON.stringify('')
    }),
    new MiniCssExtractPlugin({
      filename: 'main.css'
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      filename: resolve('dist/index-admin.html'),
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
