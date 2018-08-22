// Check if the directory already exists.
const { existsSync } = require('fs-extra')
const chalk = require('chalk')
let shouldWarn = true // Scream only once.

function safeToCreateDir({ appDir, appName, force }) {
  if (!existsSync(appDir)) return true
  if (force) {
    shouldWarn && console.log(`Force installing in pre-existing directory ${chalk.green(appName)}...`)
    shouldWarn = false
    return true
  }

  console.log(`The directory ${chalk.green(appName)} already exists.`)
  console.log('Try a different name.')
}

module.exports = safeToCreateDir
