/*
  Why this module?

  Create New App manually creates a package.json file and fills in all the dependencies.
  To use React as an example, we end up writing "react": "^16" to the file so we can get
  the latest 16.x version of React. The problem is when you look at the package.json file,
  you don't know which exact version was installed. It's much more helpful to see something
  like ^16.6.1 instead.

  This module will read package.json, distill the package names & versions down to an array,
  read the actual versions of what's already been installed, and rewrite the file with the
  actual versions, maintaining the ^ where applicable. This let's the user know what specific
  versions of the packages are installed when they take a quick glance at package.json.
*/

const { exec } = require('child_process')
const { readJsonSync, writeFileSync } = require('fs-extra')

function adjustPkgJson(appDir) {
  const packageJson = readJsonSync(`${appDir}/package.json`)
  const deps = packageJson.dependencies
  const devDeps = packageJson.devDependencies

  deps && transformVersion(deps, appDir)
  devDeps && transformVersion(devDeps, appDir)

  const finalData = JSON.stringify(packageJson, null, 2)
  writeFileSync(`${appDir}/package.json`, finalData, 'utf-8')
}

function transformVersion(obj, appDir) {
  Object.keys(obj).forEach(key => {
    const location = `${appDir}/node_modules/${key}/package.json`
    const { version } = readJsonSync(location)

    obj[key] = `^${version}`
  })
}

module.exports = adjustPkgJson
