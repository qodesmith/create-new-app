// This modules runs commands as if typed into the cli.

const { execSync } = require('child_process')

module.exports = (command, silent) => {
  /*
    The silent option mute's the commands CLI output except for errors.
    This helps keep the CLI looking clean.
  */
  const stdio = silent ? ['pipe', 'pipe', 2] : 'inherit' // http://bit.ly/2Z8xzTF
  return execSync(command, { stdio })
}
