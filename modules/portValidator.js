const chalk = require('chalk');

function portValidator(val, type) {
  const num = Number.isInteger(+val) && parseInt(val, 10);
  const defaultPort = type === 'api' ? 3000 : 8080;

  if (num < 1 || num > 65535) {
    const msg = `\n"${num}" is out of range (1 - 65535). Defaulting to ${defaultPort}...\n`;
    console.log(chalk.yellow.bold(msg));
    return defaultPort;
  }

  if (!num) {
    const msg = `\n"${val}" is an invalid port. Defaulting to ${defaultPort}...\n`;
    console.log(chalk.yellow.bold(msg));
    return defaultPort;
  }

  return num;
}

module.exports = portValidator;
