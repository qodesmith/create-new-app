/*
  This module logs info to the console in the case where the user has
  supplied cli options (such as --title="...") but didn't supply an
  app name / folder name.

  This command would trigger this module:
    * cna --title="Awesome app!"

  This command would avoid this modules:
    * cna my-awesome-app --title="Awesome app!"
*/

const chalk = require('chalk')

function noName() {
  const cna = chalk.cyan('create-new-app')

  console.log('Please specify the project directory:')
  console.log(`  ${cna} ${chalk.green('<project-directory>')}\n`)
  console.log('For example:')
  console.log(`  ${cna} ${chalk.green('my-awesome-project')}\n`)
  console.log('Or you can use the guided process:')
  console.log(`  ${cna}`)
}

module.exports = noName
