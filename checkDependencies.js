const chalk = require('chalk')
const readline = require('readline')
const run = require('./modules/run')
const formDependencies = require('./modules/dependencies')
const makeTable = require('./modules/makeTable')
const removeAnsiChars = require('./modules/removeAnsiChars')
const { devDependencies, serverDependencies } = formDependencies({ mongo: 1, redux: 1, router: 1, server: 1 })
const fullList = { ...devDependencies, ...serverDependencies }
let keys = Object.keys(fullList)
const keysLength = keys.length
const all = process.argv.some(arg => arg === '--all')
const table = [[
  chalk.bold('PACKAGE'),
  chalk.bold('USED'),
  chalk.bold('LATEST')
]]

keys.forEach((name, i) => {
  logInfo({ name, i })

  const info = run(`npm view ${name}`, true).toString('utf-8')
  const isDeprecated = info.includes('DEPRECATED')
  const latest = removeAnsiChars(info).split('\n')[1].split(' ')[0].split('@').pop().split('.')[0]
  const usedVersion = fullList[name]
  const used = usedVersion.includes('^') ? usedVersion.slice(1) : usedVersion
  name = isDeprecated ? `${chalk.bold.red('DEPRECATED:')} ${name}` : name

  if (all || isDeprecated ||  used !== latest) table.push([name, used, latest])
})

if (!table.length) {
  clearConsole()
  console.log('All packages up to date!')
} else {
  logInfo({ end: true })
}

function logInfo({ name, i, end }) {
  clearConsole()

  const num = chalk.yellow(i + 1)
  const length = chalk.green(keysLength)
  const pkg = chalk.blue(name)

  name && console.log(`${num} of ${length} - checking ${pkg}`)
  end && console.log(`Total of ${length} packages checked!`)
  if (table.length) console.log(makeTable(table, { centered: true }))
}

function clearConsole() {
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}
