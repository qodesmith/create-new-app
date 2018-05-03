#!/usr/bin/env node
// Possible permissions errors? - https://goo.gl/mH9n3j

const chalk = require('chalk');
const nodeVersion = +process.versions.node.split('.')[0];
const spaces = ' '.repeat(43 - nodeVersion.length);
const url = chalk.cyan.bold('https://github.com/creationix/nvm');

if (nodeVersion < 6) {
  const message = `
    +-------------------------------------------------------------------+
    |                                                                   |
    |  Create New App requires Node >= 6 and npm >= 3.                  |
    |  You're using version ${nodeVersion}.${spaces}|
    |  Please upgrade. The easiest way is to use Node Version Manager:  |
    |    ${url}                              |
    |                                                                   |
    +-------------------------------------------------------------------+
  `;

  console.log(message);
  process.exit(1);
}
