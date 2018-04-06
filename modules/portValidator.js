const chalk = require('chalk');

function portValidator(val, type) {
  const num = Number.isInteger(+val) ? (+val) : undefined;
  const defaultPorts = { api: 3000, dev: 8080 }
  const defaultPort = defaultPorts[type];

  if (num === undefined) {
    const msg = `\n"${val}" is an invalid port. Defaulting to ${defaultPort}...\n`;
    console.log(chalk.yellow.bold(msg));
    return defaultPort;
  }

  if (num < 1 || num > 65535) {
    const msg = `\n"${num}" is out of range (1 - 65535). Defaulting to ${defaultPort}...\n`;
    console.log(chalk.yellow.bold(msg));
    return defaultPort;
  }

  return num;
}

module.exports = portValidator;
