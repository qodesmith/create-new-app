/*
  This module will create CONTENTS for the `package.json` file.
  If the user used the --force option, this module will be as non-destructive as possible.
  Some original fields that can't be easily merged will be stored under `<original field name>_<date number>`.
*/

const fs = require('fs-extra')
const browserslistDefault = require('../modules/browserslist')
const dependenciesCreator = require('../modules/dependencies')

// Helper fxn - merges dependencies, older taking precedence, in sorted order.
function mergeDependencies(newDeps, oldDeps) {
  const unsortedDeps = {...newDeps, ...oldDeps}

  return Object.keys(unsortedDeps)
    .sort()
    .reduce((acc, pkg) => ({...acc, [pkg]: unsortedDeps[pkg]}), {})
}

// { author: 'Qodesmith' } => { author_1598530391059: 'Qodesmith' }
function storeOldProp({prop, oldObj, newObj}) {
  const datedPropName = `${prop}_${Date.now()}`
  const originalValue = oldObj[prop]

  // Do nothing if there's no original value in question.
  if (originalValue == null) return

  /*
    For scripts, we don't want to blindly store the entire old value.
    Instead, we want to store only those particular scripts that may have been overwritten.
  */
  if (prop === 'scripts' && oldObj.scripts) {
    const oldScriptConflictingValues = Object.keys(oldObj).reduce(
      (acc, key) => {
        const oldScript = oldObj.scripts[key]

        // Only store old scripts that were overwritten and aren't the same.
        if (oldScript !== newObj.scripts[key]) acc[key] = oldScript

        return acc
      },
      {},
    )

    // Only store `scripts_<date number>: { ... }` if there's any conflicting old scripts to store!
    if (Object.keys(oldScriptConflictingValues).length)
      newObj[datedPropName] = oldScriptConflictingValues

    // All other properties.
  } else {
    newObj[datedPropName] = originalValue
  }
}

function packageJson({options, destinationPath}) {
  const {
    appName,
    server,
    description,
    author,
    email,
    keywords,
    repository,
    repo,
    version,
    license,
  } = options
  const {devDependencies, serverDependencies} = dependenciesCreator(options)

  // `--bl` takes precedence over `--browserslist` so long as the later is the default setting.
  const isDefault = options.browserslist.every(
    (item, i) => item === browserslistDefault[i],
  )
  const browserslist = options[isDefault ? 'bl' : 'browserslist']

  // --force option - in the case this file already exists, read its contents so we can merge the data later.
  const originalPkgJson =
    fs.readJsonSync(destinationPath, {throws: false}) || {}

  let packageJson = {
    // First start with the original contents to capture any properties that we might not process...
    ...originalPkgJson,

    // ...then process the properties we do care about, preferring the old value over the new in most cases.
    name: originalPkgJson.name || appName,
    version: originalPkgJson.version || version || '0.1.0',
    description: description || originalPkgJson.description || '', // Prefer new.
    keywords: [
      ...new Set(keywords.concat(originalPkgJson.keywords || [])),
    ].sort(), // Merge old and new, sorted.
    author: author || originalPkgJson.author || '', // Prefer new.
    email: email || originalPkgJson.email || '', // Prefer new.
    repository: repository || repo || originalPkgJson.repository || '', // Prefer new.
    license: originalPkgJson.license || license || 'ISC', // 'ISC' is the default `npm init -y` value.
    browserslist: originalPkgJson.browserslist || browserslist, // http://bit.ly/2XpC23Q - why you should avoid `last 2 versions`.
  }

  // Preserve other properties.
  ;[
    'name',
    'version',
    'description',
    'keywords',
    'author',
    'email',
    'repository',
    'licence',
    'browserslist',
  ].forEach(prop =>
    storeOldProp({
      prop,
      oldObj: originalPkgJson,
      newObj: packageJson,
    }),
  )

  if (server) {
    const packageJsonServer = {
      main: 'server.js',
      dependencies: mergeDependencies(
        serverDependencies,
        originalPkgJson.dependencies,
      ),
      devDependencies: mergeDependencies(
        devDependencies,
        originalPkgJson.devDependencies,
      ),
      scripts: {
        // Merge in any original scripts to start with...
        ...originalPkgJson.scripts,

        // ...then possibly overwrite with the new scripts. We'll retain the entirety of the old scripts down below.
        build:
          'cross-env NODE_ENV=production webpack --mode production --env prod',
        'build:dev':
          'cross-env NODE_ENV=development webpack --mode development --env dev',
        local: 'npm run server:api',
        'server:dev': 'webpack serve --mode development --progress --env dev',
        'server:api': 'nodemon server.js',
        start: 'cross-env NODE_ENV=development npm-run-all --parallel server:*',
      },
    }

    // Store the original prop values if they existed.
    storeOldProp({prop: 'main', oldObj: originalPkgJson, newObj: packageJson})
    storeOldProp({
      prop: 'scripts',
      oldObj: originalPkgJson,
      newObj: packageJson,
    })

    packageJson = {...packageJson, ...packageJsonServer}
  } else {
    packageJson = {
      ...packageJson,
      devDependencies: mergeDependencies(
        devDependencies,
        originalPkgJson.devDependencies,
      ),
      scripts: {
        ...originalPkgJson.scripts, // Merge in any original scripts.
        build:
          'cross-env NODE_ENV=production webpack --mode production --env prod',
        start:
          'cross-env NODE_ENV=development webpack serve --mode development --progress',
      },
    }

    /*
      This will NOT store the entire old scripts obj. It's smarter than that.
      It only stores properties that conflict.
    */
    storeOldProp({
      prop: 'scripts',
      oldObj: originalPkgJson,
      newObj: packageJson,
    })
  }

  // https://mzl.la/2Xn1ua7
  return JSON.stringify(packageJson, null, 2)
}

module.exports = packageJson
