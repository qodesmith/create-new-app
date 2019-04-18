const cnaFolders = [
  '.git',
  'dist',
  'node_modules',
  'src',
  'src/assets',
  'src/components',
  'src/styles'
]

const cnaReduxFolders = [
  ...cnaFolders,
  'utils',
  'utils/actions',
  'utils/helpers',
  'utils/middleware',
  'utils/reducers'
]

const cnaRouterFolders = cnaFolders
const cnaRouterReduxFolders = cnaReduxFolders

const cnaExpressFolders = [
  ...cnaFolders,
  'api',
  'api/utilities'
]

const cnaExpressReduxFolders = [
  ...cnaReduxFolders,
  ...cnaExpressFolders
]

const cnaExpressRouterFolders = cnaExpressFolders
const cnaExpresRouterReduxFolders = cnaExpressReduxFolders

const cnaMongoFolders = cnaExpressFolders
const cnaMongoReduxFolders = cnaExpressReduxFolders
const cnaMongoRouterFolders = cnaExpressRouterFolders
const cnaMongoRouterReduxFolders = cnaExpresRouterReduxFolders


module.exports = {
  cnaFolders,
  cnaReduxFolders,
  cnaRouterFolders,
  cnaRouterReduxFolders,
  cnaExpressFolders,
  cnaExpressReduxFolders,
  cnaExpressRouterFolders,
  cnaExpresRouterReduxFolders,
  cnaMongoFolders,
  cnaMongoReduxFolders,
  cnaMongoRouterFolders,
  cnaMongoRouterReduxFolders
}
