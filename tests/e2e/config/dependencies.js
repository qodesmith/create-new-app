const serverDevDeps = [
  '@babel/core',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-object-rest-spread',
  '@babel/plugin-syntax-dynamic-import',
  '@babel/preset-env',
  '@babel/preset-react',
  '@fullhuman/postcss-purgecss',
  'autoprefixer',
  'babel-loader',
  'clean-webpack-plugin',
  'core-js',
  'cross-env',
  'css-declaration-sorter',
  'css-loader',
  'css-mqpacker',
  'cssnano',
  'fast-css-loader',
  'fast-sass-loader',
  'file-loader',
  'glob-all',
  'html-webpack-plugin',
  'mini-css-extract-plugin',
  'node-sass',
  'npm-run-all',
  'postcss',
  'postcss-colormin',
  'postcss-combine-duplicated-selectors',
  'postcss-discard-comments',
  'postcss-loader',
  'purgecss-whitelister',
  'react',
  'react-dom',
  'regenerator-runtime',
  'sass-loader',
  'sassyons',
  'style-loader',
  'terser-webpack-plugin',
  'webpack',
  'webpack-cli',
  'webpack-dev-server'
]
const devDeps = [...serverDevDeps, 'dotenv']
const reduxDeps = ['redux', 'react-redux']
const routerDeps = ['react-router-dom', 'history']
const serverDeps = [
  'chalk',
  'express',
  'helmet',
  'compression',
  'body-parser',
  'nodemon',
  'dotenv'
]
const mongoDeps = [
  ...serverDeps,
  'mongo',
  'connect-mongo',
  'express-session'
]

// Vanilla.
const vanilla = { devDependencies: devDeps }
const vanillaRedux = { devDependencies: [...devDeps, ...reduxDeps] }
const vanillaRouter = { devDependencies: [...devDeps, ...routerDeps] }
const vanillaRouterRedux = { devDependencies: [...devDeps, ...reduxDeps, ...routerDeps] }

// Express.
const express = { devDependencies: serverDevDeps, dependencies: serverDeps }
const expressRedux = { devDependencies: [...serverDevDeps, ...reduxDeps], dependencies: serverDeps }
const expressRouter = { devDependencies: [...serverDevDeps, ...routerDeps], dependencies: serverDeps }
const expressRouterRedux = {
  devDependencies: [...serverDevDeps, ...routerDeps, ...reduxDeps],
  dependencies: serverDeps
}

// Mongo.
const mongo = { devDependencies: serverDevDeps, dependencies: mongoDeps }
const mongoRedux = { devDependencies: [...serverDevDeps, ...reduxDeps], dependencies: mongoDeps }
const mongoRouter = { devDependencies: [...serverDevDeps, ...routerDeps], dependencies: mongoDeps }
const mongoRouterRedux = {
  devDependencies: [...serverDevDeps, ...routerDeps, ...reduxDeps],
  dependencies: mongoDeps
}


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
  mongoRouterRedux
}
