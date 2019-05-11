/*
  Why this module?

  Create New App manually creates a package.json file and fills in all the dependencies.
  To use React as an example, we end up writing "react": "^16" to the file so we can get
  the latest 16.x version of React. The problem is when you look at the package.json file,
  you don't know which exact version was installed. It's much more helpful to see something
  like ^16.6.1 instead.

  This module will read package.json, distill the package names & versions down to an array,
  read the actual versions of what's already been installed, and rewrite the file with the
  actual versions. This let's the user know what specific versions of the packages are installed
  when they take a quick glance at package.json.
*/

const { readJSONSync, writeFileSync } = require('fs-extra')

function adjustPkgJson(folder) {
  const packageJson = readJSONSync(`${folder}/package.json`)
  const deps = packageJson.dependencies
  const devDeps = packageJson.devDependencies

  // Mutate the objects and write new values for the version.
  deps && transformVersion(deps, folder)
  devDeps && transformVersion(devDeps, folder)

  const finalData = JSON.stringify(packageJson, null, 2)
  writeFileSync(`${folder}/package.json`, finalData, 'utf-8')
}

// This function mutates the original object.
function transformVersion(obj, folder) {
  Object.keys(obj).forEach(pkg => {
    const location = `${folder}/node_modules/${pkg}/package.json`
    const { version } = readJSONSync(location)

    obj[pkg] = `^${version}`
  })
}

module.exports = adjustPkgJson
