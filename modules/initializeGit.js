const chalk = require('chalk')
const run = require('./run')

function initializeGit() {
  try {
    run('git init -b main', true) // Don't display stdout.
    console.log(
      `\nInitialized a new ${chalk.bold('git')} repository with a ${chalk.bold(
        'main',
      )} branch.`,
    )
  } catch (e) {
    console.log(
      `Tried to initialize a new ${chalk.bold('git')} repository but couldn't.`,
    )
    console.log(`Do you have have ${chalk.bold('git')} installed?`)
    console.log('  * https://git-scm.com/downloads\n')
  }
}

module.exports = initializeGit
