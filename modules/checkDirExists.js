// Check if the directory already exists.
const { existsSync } = require('fs-extra');
const chalk = require('chalk');

function checkDirExists({ appDir, appName, force }) {
  if (!existsSync(appDir)) return;
  console.log(`The directory ${chalk.green(appName)} already exists.`);

  if (force) return console.log('Force installing in pre-existing directory...');
  console.log('Try a different name.') && process.exit();
}

module.exports = checkDirExists;
