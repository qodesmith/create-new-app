const chalk = require('chalk');

function noName() {
  const npc = chalk.cyan('create-new-app');

  console.log('Please specify the project directory:');
  console.log(`  ${npc} ${chalk.green('<project-directory>')}\n`);
  console.log('For example:');
  console.log(`  ${npc} ${chalk.green('my-awesome-project')}`);
}

module.exports = noName;
