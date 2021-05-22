/*
  When updating a dependency, be sure to update the following:
    * This file, lolz.
    * modules/dependencies.js
    * tests/unit/dependencies.test.js (update snapshots)
*/

const serverDevDeps = {
  '@babel/core': '^7',
  '@babel/plugin-proposal-class-properties': '^7',
  '@babel/plugin-proposal-object-rest-spread': '^7',
  '@babel/plugin-syntax-dynamic-import': '^7',
  '@babel/plugin-proposal-optional-chaining': '^7',
  '@babel/plugin-proposal-nullish-coalescing-operator': '^7',
  '@babel/preset-env': '^7',
  '@babel/preset-react': '^7',
  '@fullhuman/postcss-purgecss': '^4',
  '@pmmmwh/react-refresh-webpack-plugin': '^0',
  autoprefixer: '^10',
  'babel-loader': '^8',
  'clean-webpack-plugin': '^3',
  'core-js': '^3',
  'cross-env': '^7',
  'css-declaration-sorter': '^6',
  'css-loader': '^5',
  cssnano: '^4',
  'file-loader': '^6',
  'html-webpack-plugin': '^5',
  'mini-css-extract-plugin': '^1',
  'npm-run-all': '^4',
  postcss: '^8',
  'postcss-combine-duplicated-selectors': '^10',
  'postcss-combine-media-query': '^1',
  'postcss-loader': '^5',
  'purgecss-whitelister': 'latest',
  react: '^17',
  'react-dom': '^17',
  'regenerator-runtime': '^0',
  sass: '^1',
  'sass-loader': '^11',
  sassyons: 'latest',
  'style-loader': '^2',
  'terser-webpack-plugin': '^5',
  webpack: '^5',
  'webpack-cli': '^4',
  'webpack-dev-server': '^3',
}
const devDeps = {...serverDevDeps, dotenv: '^8', chalk: '^4'}
const routerDeps = {'react-router-dom': '^5', history: '^5'}
const serverDeps = {
  chalk: '^4',
  express: '^4',
  helmet: '^4',
  compression: '^1',
  'body-parser': '^1',
  nodemon: '^2',
  dotenv: '^8',
}
const mongoDeps = {
  ...serverDeps,
  mongodb: '^3',
  saslprep: '^1', // This was added to stop MongoClient warnings.
  'connect-mongo': '^4',
  'express-session': '^1',
}

// Vanilla.
const vanilla = {devDependencies: devDeps}
const vanillaRouter = {devDependencies: {...devDeps, ...routerDeps}}

// Express.
const express = {devDependencies: serverDevDeps, dependencies: serverDeps}
const expressRouter = {
  devDependencies: {...serverDevDeps, ...routerDeps},
  dependencies: serverDeps,
}

// Mongo (always includes Express).
const mongo = {devDependencies: serverDevDeps, dependencies: mongoDeps}
const mongoRouter = {
  devDependencies: {...serverDevDeps, ...routerDeps},
  dependencies: mongoDeps,
}

// Latest.
const latestPackages = [devDeps, routerDeps, mongoDeps].reduce((acc, obj) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === 'latest') acc.push(key)
  })

  return acc
}, [])

module.exports = {
  vanilla,
  vanillaRouter,

  express,
  expressRouter,

  mongo,
  mongoRouter,

  latestPackages,
}
