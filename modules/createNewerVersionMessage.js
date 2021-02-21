const chalk = require('chalk')
const run = require('./run')
const getVersion = require('./getVersion')
const makeTable = require('./makeTable')
const indentFromZero = require('./indentFromZero')

module.exports = function createNewerVersionMessage() {
  const data = run('npm view create-new-app --json', true)
  try {
    const current = getVersion()
    const {latest} = JSON.parse(data)['dist-tags']

    return current === latest ? null : createMessage({current, latest})
  } catch {
    return null
  }
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
