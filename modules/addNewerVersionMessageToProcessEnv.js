const chalk = require('chalk')
const run = require('./run')
const getVersion = require('./getVersion')
const makeTable = require('./makeTable')
const indentFromZero = require('./indentFromZero')
const {CNA_LATEST_MESSAGE} = require('./constants')

function addNewerVersionMessageToProcessEnv() {
  // Running this asynchronously so as not to block the regular cna process.
  const latestCnaVersionPromise = new Promise((resolve, reject) => {
    run('npm view create-new-app --json', (error, stdout, stderr) => {
      if (error || stderr) {
        return reject(error || stderr)
      }

      try {
        const current = getVersion()
        const {latest} = JSON.parse(stdout)['dist-tags']
        resolve({current, latest})
      } catch (e) {
        reject(e)
      }
    })
  })

  return latestCnaVersionPromise()
    .then(value => {
      const message = createMessage(value)
      process.env[CNA_LATEST_MESSAGE] = message

      return message
    })
    .catch(e => e)
}

function createMessage({current, latest}) {
  const contents = `
    There's a new version of ${chalk.bold.green('create-new-app')}!

    Your version: ${chalk.yellow(current)}
    Latest version: ${chalk.yellow.bold(latest)}

    You can upgrade by running:
    ${chalk.cyan(`npm i -g create-new-app@latest`)}
  `
  const adjustedContents = indentFromZero(contents, {both: true})
  const table = makeTable([[adjustedContents]], {
    rounded: true,
    centered: true,
  })

  return table
}

module.exports = addNewerVersionMessageToProcessEnv
