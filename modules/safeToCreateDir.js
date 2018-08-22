// Check if the directory already exists.
const { existsSync } = require('fs-extra')
const chalk = require('chalk')

function safeToCreateDir({ appDir, appName, force }) {
  if (!existsSync(appDir)) return true
  if (force) return console.log('Force installing in pre-existing directory...'), true

  console.log(`The directory ${chalk.green(appName)} already exists.`)
  console.log('Try a different name.')
}

module.exports = safeToCreateDir
