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
