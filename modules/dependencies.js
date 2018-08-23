// NPM Semver Calculator - https://semver.npmjs.com/

const dependencyReducer = obj => (
  Object.keys(obj).sort().reduce((acc, key) => {
    if (obj[key]) acc[key] = obj[key]
    return acc
  }, {})
)

const dependencies = (mongo, redux, router) => {
  const devDependencies = {
    // MAIN
    react: '^16',
    'react-dom': '^16',
    sassyons: '^2',
    redux: (redux || router) && '^3',
    'react-redux': (redux || router) && '^5',
    'react-router-dom': router && '^4',
    history: router && '^4',

    // POSTCSS
    // https://cssnano.co/optimisations/ - list of plugins.
    'postcss-loader': '^2',
    postcss: '^6',
    cssnano: '^4',
    '@fullhuman/postcss-purgecss': '^1', // https://goo.gl/igXRk6 - why we're using purge-css *here* and not as a Webpack plugin.
    'purgecss-whitelister': 'latest', // Always keep latest.
    'postcss-discard-comments': '^2',
    'css-mqpacker': '^6',
    'postcss-combine-duplicated-selectors': '^5',
    autoprefixer: '^8',
    'postcss-colormin': '^4',
    'css-declaration-sorter': '^4',


    // WEBPACK
    webpack: '^4',
    'webpack-cli': '^3',
    'webpack-dev-server': '^3',
    'mini-css-extract-plugin': '^0', // Currently < 1
    'clean-webpack-plugin': '^0', // Currently < 1
    'html-webpack-plugin': '^3',
    'glob-all': 'latest', // Always keep latest
    'css-loader': '^1',
    'file-loader': '^1',
    'sass-loader': '^6',
    'node-sass': '^4',
    'style-loader': '^0', // Currently < 1,
    'uglifyjs-webpack-plugin': '^1',

    // BABEL - https://goo.gl/ESXgmh
    'babel-loader': '^8.0.0-beta',
    '@babel/core': '^7.0.0-beta',
    '@babel/preset-env': '^7.0.0-beta',
    '@babel/preset-react': '^7.0.0-beta',
    '@babel/plugin-proposal-object-rest-spread': '^7.0.0-beta',
    '@babel/plugin-proposal-class-properties': '^7.0.0-beta',
    '@babel/polyfill': '^7.0.0-beta',


    // OTHER
    'cross-env': '^5',
    'npm-run-all': 'latest', // Always keep latest.
    'dotenv': 'latest' // Always keep latest.
  }

  // These will only take effect if we're creating an app with a server.
  // They will be saved in `package.json` as `dependencies`.
  const serverDependencies = {
    // SERVER
    express: '^4',
    helmet: '^3',
    compression: '^1',
    'body-parser': '^1',
    nodemon: 'latest', // Always keep latest.

    // MONGO
    mongodb: mongo && '^3',
    'connect-mongodb-session': mongo && '^2',
    'express-session': mongo && '^1',
  }

  return {
    devDependencies: dependencyReducer(devDependencies),
    serverDependencies: dependencyReducer(serverDependencies)
  }
}

module.exports = dependencies
