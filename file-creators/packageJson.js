/*
  This module will create CONTENTS for the `package.json` file.
  If the user used the --force option, this module will be as non-destructive as possible.
  Some original fields that can't be easily merged will stored under `_old_<original field>`.
  

  Data that is truly lost as a result of the --force option:
    * Command line provided fields:
      - (description, author, email, repository) - will overwrite these existing values.
*/

const fs = require('fs-extra')
const browserslistDefault = require('../modules/browserslist')
const dependenciesCreator = require('../modules/dependencies')

// Helper fxn - merges dependencies, older taking precedence, in sorted order.
function mergeDependencies(newDeps, oldDeps) {
  const unsortedDeps = { ...newDeps, ...oldDeps }

  return Object
    .keys(unsortedDeps)
    .sort()
    .reduce((acc, pkg) => ({ ...acc, [pkg]: acc[pkg] }), {})
}

// { prop: '123' } => { _old_prop: '123 }
function storeOldProp({ prop, original, newObj }) {
  const originalValue = original[prop]
  const oldPropName = `_old_${prop}`

  // Do nothing if there's no original value in question.
  if (originalValue == null) return

  /*
    For scripts, we don't want to blindly store the entire old value.
    Instead, we want to store only those particular scripts that may have been overwritten.
  */
  if (prop === 'scripts') {
    const oldScriptConflictingValues = Object.keys(originalValue).reduce((acc, key) => {
      const oldScript = original.scripts[key]

      // Only store old scripts that were overwritten and aren't the same.
      if (oldScript !== newObj.scripts[key]) acc[key] = oldScript

      return acc
    }, {})

    // Only store `old_scripts: { ... }` if there's any conflicting old scripts to store!
    if (Object.keys(oldScriptConflictingValues).length) newObj[oldPropName] = oldScriptConflictingValues

  // All other properties.
  } else {
    newObj[oldPropName] = originalValue
  }
}

function packageJson({ options, destinationPath }) {
  const { appName, server, description, author, email, keywords, repository, repo } = options
  const { devDependencies, serverDependencies } = dependenciesCreator(options)

  // `--bl` takes precedence over `--browserslist` so long as the later is the default setting.
  const isDefault = options.browserslist.every((item, i) => item === browserslistDefault[i])
  const browserslist = options[isDefault ? 'bl' : 'browserslist']

  // --force option - in the case this file already exists, read its contents so we can merge the data later.
  let originalPkgJson = {}
  try {
    originalPkgJson = JSON.parse(fs.readFileSync(destinationPath, 'utf8'))
  } catch (e) {}

  let packageJson = {
    // First start with the original contents to capture any properties that we might not process...
    ...originalPkgJson,

    // ...then process the properties we do care about, preferring the old value over the new in most cases.
    name: originalPkgJson.name || appName,
    version: originalPkgJson.version || '0.1.0',
    description: description || originalPkgJson.description || '', // Prefer new.
    keywords: [...new Set(keywords.concat(originalPkgJson.keywords || []))].sort(), // Merge old and new, sorted.
    author: author || originalPkgJson.author || '', // Prefer new.
    email: email || originalPkgJson.email || '', // Prefer new.
    repository: repository || repo || originalPkgJson.repository || '', // Prefer new.
    license: originalPkgJson.license || 'ISC', // 'ISC' is the default `npm init -y` value.
    browserslist: originalPkgJson.browserslist || browserslist // http://bit.ly/2XpC23Q - why you should avoid `last 2 versions`.
  }

  if (server) {
    const packageJsonServer = {
      main: 'server.js',
      dependencies: mergeDependencies(serverDependencies, originalPkgJson.dependencies),
      devDependencies: mergeDependencies(devDependencies, originalPkgJson.devDependencies),
      scripts: {
        // Merge in any original scripts to start with...
        ...originalPkgJson.scripts,

        // ...then possibly overwrite with the new scripts. We'll retain the entirety of the old scripts down below.
        build: 'cross-env NODE_ENV=production webpack --mode production --env.prod',
        'build:dev': 'cross-env NODE_ENV=development webpack --mode development --env.dev',
        local: 'npm run server:api',
        'server:dev': 'webpack-dev-server --mode development --env.dev --progress',
        'server:api': 'nodemon server.js',
        start: 'cross-env NODE_ENV=development npm-run-all --parallel server:*'
      }
    }

    // Store the original prop values if they existed.
    storeOldProp({ prop: 'main', original: originalPkgJson, newObj: packageJson })
    storeOldProp({ prop: 'scripts', original: originalPkgJson, newObj: packageJson })

    packageJson = { ...packageJson, ...packageJsonServer }
  } else {
    packageJson = {
      ...packageJson,
      devDependencies: mergeDependencies(devDependencies, originalPkgJson.devDependencies),
      scripts: {
        ...originalPkgJson.scripts, // Merge in any original scripts.
        build: 'cross-env NODE_ENV=production webpack --mode production --env.prod',
        start: 'cross-env NODE_ENV=development webpack-dev-server --mode development --env.dev --progress'
      }
    }

    /*
      This will NOT store the entire old scripts obj. It's smarter than that.
      It only stores properties that conflict.
    */
    storeOldProp({prop: 'scripts', original: originalPkgJson, newObj: packageJson})
  }

  // https://mzl.la/2Xn1ua7
  return JSON.stringify(packageJson, null, 2)
}

module.exports = packageJson
