/*
  This module logs info to the console in the case where the user
  has supplied an app name incompatible with npm naming rules.
*/

const chalk = require('chalk')

function badName(name, validation) {
  const { errors, warnings } = validation
  const redName = chalk.red(`"${name}"`)

  console.log(`Could not create a project called ${redName} because of npm naming restrictions:`)
  errors && errors.forEach(msg => console.log(chalk.red(`  *  ${msg}`)))
  warnings && warnings.forEach(msg => console.log(chalk.yellow(`  *  ${msg}`)))
}

module.exports = badName
