const cna = {
  './': [
    '.env',
    '.gitignore',
    'after-compile-plugin.js',
    'package.json',
    'package-lock.json',
    'postcss.config.js',
    'README.md',
    'webpack.config.js'
  ],
  './.git': null,
  './dist': ['favicon.ico', 'robots.txt'],
  './node_modules': null,
  './src': ['entry.js', 'index.ejs'],
  './src/assets': [],
  './src/components': ['App.jsx'],
  './src/styles': ['_global.scss', 'styles.scss']
}

const cnaRedux = {
  ...cna,
  './src': ['entry.js', 'index.ejs', 'store.js'],
  './src/utils': [],
  './src/utils/actions': ['index.js'],
  './src/utils/helpers': ['index.js'],
  './src/utils/middleware': [],
  './src/utils/reducers': ['appReducer.js'],
}

const cnaRouter = {
  ...cna,
  './src/components': ['Home.jsx', 'NotFound.jsx'],
}

const cnaRouterRedux = {}


module.exports = {
  cna,
  cnaRedux,
  cnaRouter
}
