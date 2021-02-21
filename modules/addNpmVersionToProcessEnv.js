const run = require('./run')
const {NPM_VERSION_KEY} = require('./constants')

function addNpmVersionToProcessEnv() {
  // Running this asynchronously so as not to block the regular cna process.
  const npmVersionPromise = new Promise((resolve, reject) => {
    run('npm -v', (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr)
      } else {
        // The output contains a newline character.
        resolve(stdout.split('\n')[0])
      }
    })
  })

  return npmVersionPromise
    .then(version => {
      process.env[NPM_VERSION_KEY] = version
      return version
    })
    .catch(e => e)
}

module.exports = addNpmVersionToProcessEnv
