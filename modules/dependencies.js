// NPM Semver Calculator - https://semver.npmjs.com/

var dependencyReducer = obj => Object.entries(obj).reduce((acc, pkg) => {
  const [name, version] = pkg
  return version ? { ...acc, [name]: version } : acc
}, {})

const dependencies = (mongo, redux, router) => {
  var devDependencies = {
    // MAIN
    react: '^16',
    'react-dom': '^16',
    sassyons: '^1',
    redux: redux && '^3',
    'react-redux': redux && '^5',
    'redux-first-router': router && '0.0.16-next', // Currently < 1, on the road to "Rudy".
    'redux-first-router-link': router && '^1',
    history: router && '^4',

    // POSTCSS
    postcss: '^6',
    'postcss-loader': '^2',
    autoprefixer: '^8',
    'css-mqpacker': '^6',
    'postcss-discard-comments': '^2',
    'postcss-combine-duplicated-selectors': '^5',

    // WEBPACK
    webpack: '^4',
    'webpack-cli': '^2',
    'webpack-dev-server': '^3',
    'mini-css-extract-plugin': '^0', // Currently < 1
    'clean-webpack-plugin': '^0', // Currently < 1
    'html-webpack-plugin': '^3',
    'purgecss-webpack-plugin': '^1',
    'purgecss-whitelister': 'latest', // Always keep latest.
    'glob-all': 'latest', // Always keep latest
    'css-loader': '^0', // Currently < 1
    'sass-loader': '^6',
    'node-sass': '^4',

    // BABEL - https://goo.gl/ESXgmh
    'babel-loader': '^8.0.0-beta',
    '@babel/core': '^7.0.0-beta',
    '@babel/preset-env': '^7.0.0-beta',
    '@babel/preset-react': '^7.0.0-beta',
    '@babel/plugin-proposal-object-rest-spread': '^7.0.0-beta',
    '@babel/plugin-proposal-class-properties': '^7.0.0-beta',


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
    catchify: mongo && '^2',
    'connect-mongodb-session': mongo && '^2',
    'express-session': mongo && '^1',
  }

  return {
    devDependencies: dependencyReducer(devDependencies),
    serverDependencies: dependencyReducer(serverDependencies)
  }
}

module.exports = dependencies
