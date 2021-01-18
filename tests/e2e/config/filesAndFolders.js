/*
  When testing locally and not wanting to actually do an `npm install`,
  there won't be a `package-lock.json` file. Passing the `noInstall`
  argument to the test runner will help us filter it out for tests.
*/
const noInstall = process.env.NO_INSTALL

const cna = {
  './': [
    '.env',
    '.gitignore',
    '.prettierrc',
    '.prettierignore',
    'after-compile-plugin.js',
    'package.json',
    !noInstall && 'package-lock.json', // Only available when `npm install` is run.
    'postcss.config.js',
    'README.md',
    'webpack.config.js',
  ].filter(Boolean),
  './.git': null,
  './dist': ['favicon.ico', 'robots.txt'],
  './node_modules': null,
  './src': ['entry.jsx', 'index.ejs'],
  './src/assets': [],
  './src/helpers': ['index.js'],
  './src/hooks': ['useUpdatingClock.js'],
  './src/components': ['App.jsx'],
  './src/styles': ['global.scss', 'styles.scss'],
}

const cnaRouter = {
  ...cna,
  './src/components': ['Home.jsx', 'NotFound.jsx'],
}

const cnaExpress = {
  ...cna,
  './': [...cna['./'], 'server.js'],
  './api': ['home.js'],
  './api/utilities': ['catchy.js', 'errorUtil.js'],
}

const cnaExpressRouter = {
  ...cnaExpress,
  ...cnaRouter,
  './': cnaExpress['./'],
}

const cnaMongo = {
  ...cnaExpress,
  './api/utilities': [
    'catchy.js',
    'errorUtil.js',
    'handleErrors.js',
    'logMongoAuthWarning.js',
    'mongo.js',
  ],
}

const cnaMongoRouter = {
  ...cnaExpressRouter,
  ...cnaMongo,
  './src/components': cnaRouter['./src/components'],
}

module.exports = {
  cna,
  cnaRouter,

  cnaExpress,
  cnaExpressRouter,

  cnaMongo,
  cnaMongoRouter,
}
