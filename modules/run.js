// This modules runs commands as if typed into the cli.

const {execSync, exec} = require('child_process')

module.exports = (command, silentOrCallback) => {
  /*
    The silent option mute's the commands CLI output except for errors.
    This helps keep the CLI looking clean.

                0              1               2
    Positions: [process.stdin, process.stdout, process.stderr]

    inherit - Child will use parent's stdios. Pass through the corresponding
              stdio stream to/from the parent process.

    pipe    - Spawned child will not share this with the parent - "mute". This
              will also pipe the output so you can capture it in a variable:
              `const x = run(command, true)` will pipe the output to `x`.
  */

  if (typeof silentOrCallback === 'function') {
    return exec(
      command,
      {windowsHide: true, encoding: 'utf8'},
      silentOrCallback, // (error, stdout, stderr) => {...}
    )
  } else {
    return execSync(command, {
      //                         stdin   stdout  stderr
      stdio: silentOrCallback ? ['pipe', 'pipe', 'inherit'] : 'inherit', // http://bit.ly/2Z8xzTF
      encoding: 'utf8',
    })
  }
}
