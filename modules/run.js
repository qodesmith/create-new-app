// Runs commands as if typed into the cli.

module.exports = (command, silent) => {
  /*
    The silent option mute's the commands CLI output except for errors.
    This helps keep the CLI looking clean.
  */
  const stdio = silent ? ['pipe', 'pipe', 2] : 'inherit'; // https://goo.gl/QnaS5C
  execSync(command, { stdio });
};
