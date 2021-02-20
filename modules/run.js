// This modules runs commands as if typed into the cli.

const {execSync, execFile} = require('child_process')

module.exports = (command, silent, cb) => {
  /*
    The silent option mute's the commands CLI output except for errors.
    This helps keep the CLI looking clean.

                0              1               2
    Positions: [process.stdin, process.stdout, process.stderr]

    inherit - Child will use parent's stdios. Pass through the corresponding
              stdio stream to/from the parent process.

    pipe    - Spawned child will not share this with the parent - "mute".

    http://bit.ly/2Z8xzTF
  */
  //                      stdin   stdout  stderr
  const stdio = silent ? ['pipe', 'pipe', 'inherit'] : 'inherit'

  if (cb) {
    // execFile has a slight performance advantage over exec.
    execFile(command, {stdio: 'inherit', encoding: 'utf8'}, cb)
  } else {
    return execSync(command, {stdio, encoding: 'utf8'})
  }
}
