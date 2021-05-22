/*
  This module contains all the dependencies and devDependencies for the
  generated app. They are returned as objects to be consumed later down the line.

  When updating a dependency, be sure to update the following:
    * This file, lolz.
    * tests/e2e/config/dependencies.js
    * tests/unit/dependencies.test.js (update snapshots)
*/

// NPM Semver Calculator - https://semver.npmjs.com/

const dependencyReducer = obj =>
  Object.keys(obj)
    .sort()
    .reduce((acc, pkg) => {
      if (obj[pkg]) acc[pkg] = obj[pkg]
      return acc
    }, {})

const dependencies = ({mongo, router, server}) => {
  const devDependencies = {
    // MAIN
    react: '^17',
    'react-dom': '^17',
    sassyons: 'latest', // Always install the latest.
    'react-router-dom': router && '^5',
    history: router && '^5',

    // POSTCSS
    // https://cssnano.co/optimisations/ - list of plugins.
    'postcss-loader': '^5',
    postcss: '^8',
    cssnano: '^4',
    '@fullhuman/postcss-purgecss': '^4', // http://bit.ly/2Xtfwao - why we're using purge-css *here* and not as a Webpack plugin.
    'purgecss-whitelister': 'latest', // Always install the latest.
    'postcss-combine-media-query': '^1',
    'postcss-combine-duplicated-selectors': '^10',
    autoprefixer: '^10',
    'css-declaration-sorter': '^6',

    // WEBPACK
    webpack: '^5',
    'webpack-cli': '^4',
    'webpack-dev-server': '^3',
    'mini-css-extract-plugin': '^1',
    'clean-webpack-plugin': '^3',
    'html-webpack-plugin': '^5',
    'file-loader': '^6',
    'css-loader': '^5',
    sass: '^1',
    'sass-loader': '^11',
    'style-loader': '^2',
    'terser-webpack-plugin': '^5',
    '@pmmmwh/react-refresh-webpack-plugin': '^0',

    // BABEL - http://bit.ly/2IdVyKe
    'babel-loader': '^8',
    '@babel/core': '^7',
    '@babel/preset-env': '^7',
    '@babel/preset-react': '^7',
    '@babel/plugin-proposal-object-rest-spread': '^7',
    '@babel/plugin-proposal-class-properties': '^7',
    '@babel/plugin-syntax-dynamic-import': '^7',
    '@babel/plugin-proposal-optional-chaining': '^7',
    '@babel/plugin-proposal-nullish-coalescing-operator': '^7',
    'core-js': '^3', //              \  http://bit.ly/2DTXGpe
    'regenerator-runtime': '^0', //  /  These two packages combined now replace `@babel/polyfill`.

    // OTHER
    chalk: !server && '^4', // This is also below in `serverDependencies`.
    'cross-env': '^7',
    dotenv: !server && '^8', // This is also below in `serverDependencies`.
    'npm-run-all': '^4',
  }

  // These will only take effect if we're creating an app with a server.
  // They will be saved in `package.json` as `dependencies`.
  const serverDependencies = {
    // SERVER
    chalk: '^4', // This is also conditionally above in `devDependencies`.
    express: '^4',
    helmet: '^4',
    compression: '^1',
    'body-parser': '^1',
    nodemon: '^2',
    dotenv: '^8', // This is also conditionally above in `devDependencies`.

    // MONGO
    mongodb: mongo && '^3',
    saslprep: mongo && '^1', // Needed for MongoClient, otherwise it logs warnings -_-
    'connect-mongo': mongo && '^4',
    'express-session': mongo && '^1',
  }

  return {
    devDependencies: dependencyReducer(devDependencies),
    serverDependencies:
      mongo || server ? dependencyReducer(serverDependencies) : {},
  }
}

module.exports = dependencies
