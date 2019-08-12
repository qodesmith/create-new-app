/*
  When updating a dependency, be sure to update the following:
    * This file, lolz.
    * modules/dependencies.js
    * tests/unit/dependencies.test.js
*/

const serverDevDeps = {
  '@babel/core': '^7',
  '@babel/plugin-proposal-class-properties': '^7',
  '@babel/plugin-proposal-object-rest-spread': '^7',
  '@babel/plugin-syntax-dynamic-import': '^7',
  '@babel/preset-env': '^7',
  '@babel/preset-react': '^7',
  '@fullhuman/postcss-purgecss': '^1',
  'autoprefixer': '^9',
  'babel-loader': '^8',
  'clean-webpack-plugin': '^3',
  'core-js': '^3',
  'cross-env': '^5',
  'css-declaration-sorter': '^4',
  'css-loader': '^2',
  'cssnano': '^4',
  'fast-css-loader': '^1',
  'fast-sass-loader': '^1',
  'file-loader': '^3',
  'glob-all': 'latest',
  'html-webpack-plugin': '^3',
  'mini-css-extract-plugin': '^0',
  'node-sass': '^4',
  'npm-run-all': 'latest',
  'postcss': '^7',
  'postcss-combine-duplicated-selectors': '^7',
  'postcss-extract-media-query': '^1',
  'postcss-loader': '^3',
  'purgecss-whitelister': 'latest',
  'react': '^16',
  'react-dom': '^16',
  'regenerator-runtime': '^0',
  'sass-loader': '^7',
  'sassyons': '^3',
  'style-loader': '^0',
  'terser-webpack-plugin': '^1',
  'webpack': '^4',
  'webpack-cli': '^3',
  'webpack-dev-server': '^3'
}
const devDeps = { ...serverDevDeps, 'dotenv': '^8' }
const reduxDeps = { 'redux': '^4', 'react-redux': '^7' }
const routerDeps = { 'react-router-dom': '^5', 'history': '^4' }
const serverDeps = {
  'chalk': '^2',
  'express': '^4',
  'helmet': '^3',
  'compression': '^1',
  'body-parser': '^1',
  'nodemon': 'latest',
  'dotenv': '^8'
}
const mongoDeps = {
  ...serverDeps,
  'mongodb': '^3',
  'connect-mongo': '^2',
  'express-session': '^1'
}

// Vanilla.
const vanilla = { devDependencies: devDeps }
const vanillaRedux = { devDependencies: { ...devDeps, ...reduxDeps } }
const vanillaRouter = { devDependencies: { ...devDeps, ...routerDeps } }
const vanillaRouterRedux = { devDependencies: { ...devDeps, ...reduxDeps, ...routerDeps } }

// Express.
const express = { devDependencies: serverDevDeps, dependencies: serverDeps }
const expressRedux = { devDependencies: { ...serverDevDeps, ...reduxDeps }, dependencies: serverDeps }
const expressRouter = { devDependencies: { ...serverDevDeps, ...routerDeps }, dependencies: serverDeps }
const expressRouterRedux = {
  devDependencies: { ...serverDevDeps, ...routerDeps, ...reduxDeps },
  dependencies: serverDeps
}

// Mongo.
const mongo = { devDependencies: serverDevDeps, dependencies: mongoDeps }
const mongoRedux = { devDependencies: { ...serverDevDeps, ...reduxDeps }, dependencies: mongoDeps }
const mongoRouter = { devDependencies: { ...serverDevDeps, ...routerDeps }, dependencies: mongoDeps }
const mongoRouterRedux = {
  devDependencies: { ...serverDevDeps, ...routerDeps, ...reduxDeps },
  dependencies: mongoDeps
}

// Latest.
const latestPackages = [ 'glob-all', 'npm-run-all', 'purgecss-whitelister', 'nodemon' ]


module.exports = {
  vanilla,
  vanillaRedux,
  vanillaRouter,
  vanillaRouterRedux,

  express,
  expressRedux,
  expressRouter,
  expressRouterRedux,

  mongo,
  mongoRedux,
  mongoRouter,
  mongoRouterRedux,

  latestPackages
}
