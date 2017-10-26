const chalk = require('chalk');

function noName() {
  const cna = chalk.cyan('create-new-app');

  console.log('Please specify the project directory:');
  console.log(`  ${cna} ${chalk.green('<project-directory>')}\n`);
  console.log('For example:');
  console.log(`  ${cna} ${chalk.green('my-awesome-project')}`);
}

module.exports = noName;
