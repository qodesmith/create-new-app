// NPM Semver Calculator - https://semver.npmjs.com/

const dependencyReducer = obj => (
  Object.keys(obj).sort().reduce((acc, pkg) => {
    if (obj[pkg]) acc[pkg] = obj[pkg]
    return acc
  }, {})
)

const dependencies = (mongo, redux, router) => {
  const devDependencies = {
    // MAIN
    react: '^16',
    'react-dom': '^16',
    sassyons: '^2',
    redux: (redux || router) && '^4',
    'react-redux': (redux || router) && '^5', // Wait to upgrade until hooks support is ironed out.
    'react-router-dom': router && '^5',
    history: router && '^4',

    // POSTCSS
    // https://cssnano.co/optimisations/ - list of plugins.
    'postcss-loader': '^3',
    postcss: '^7',
    cssnano: '^4',
    '@fullhuman/postcss-purgecss': '^1', // https://goo.gl/igXRk6 - why we're using purge-css *here* and not as a Webpack plugin.
    'purgecss-whitelister': 'latest', // Always install latest.
    'postcss-discard-comments': '^4',
    'css-mqpacker': '^7',
    'postcss-combine-duplicated-selectors': '^7',
    autoprefixer: '^9',
    'postcss-colormin': '^4',
    'css-declaration-sorter': '^4',

    // WEBPACK
    webpack: '^4',
    'webpack-cli': '^3',
    'webpack-dev-server': '^3',
    'mini-css-extract-plugin': '^0', // Currently < 1
    'clean-webpack-plugin': '^1',
    'html-webpack-plugin': '^3',
    'glob-all': 'latest', // Always install latest.
    'file-loader': '^3',
    'css-loader': '^2', // Still included to allow users to choose.
    'fast-css-loader': '^1',
    'sass-loader': '^7', // Still included to allow users to choose.
    'fast-sass-loader': '^1',
    'node-sass': '^4',
    'style-loader': '^0', // Currently < 1
    'terser-webpack-plugin': '^1',

    // BABEL - https://goo.gl/ESXgmh
    'babel-loader': '^8',
    '@babel/core': '^7',
    '@babel/preset-env': '^7',
    '@babel/preset-react': '^7',
    '@babel/plugin-proposal-object-rest-spread': '^7',
    '@babel/plugin-proposal-class-properties': '^7',
    '@babel/plugin-syntax-dynamic-import': '^7',
    '@babel/polyfill': '^7',

    // OTHER
    'cross-env': '^5',
    'npm-run-all': 'latest', // Always install latest.
    dotenv: '^7'
  }

  // These will only take effect if we're creating an app with a server.
  // They will be saved in `package.json` as `dependencies`.
  const serverDependencies = {
    // SERVER
    chalk: '^2',
    express: '^4',
    helmet: '^3',
    compression: '^1',
    'body-parser': '^1',
    nodemon: 'latest', // Always install latest.

    // MONGO
    mongodb: mongo && '^3',
    'connect-mongo': '^2',
    'express-session': mongo && '^1',
  }

  return {
    devDependencies: dependencyReducer(devDependencies),
    serverDependencies: dependencyReducer(serverDependencies)
  }
}

module.exports = dependencies
