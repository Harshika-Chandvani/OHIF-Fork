const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, '../');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = {
  app: `${SRC_DIR}/index.tsx`,
};

const outputName = `ohif-${pkg.name.split('/').pop()}`;

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR, ENTRY });

  return merge(commonConfig, {
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    output: {
      path: DIST_DIR,
      filename: `${outputName}.js`,
      libraryTarget: 'umd',
      library: 'OHIFModeEcg',
      umdNamedDefine: true,
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: `${outputName}.css`,
      }),
    ],
  });
};
