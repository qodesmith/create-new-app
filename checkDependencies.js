const chalk = require('chalk')
const readline = require('readline')
const run = require('./modules/run')
const formDependencies = require('./modules/dependencies')
const { devDependencies, serverDependencies } = formDependencies(true, true, true)
const fullList = { ...devDependencies, ...serverDependencies }
const table = []
const keys = Object.keys(fullList)
const keysLength = keys.length

keys.forEach((name, i) => {
  logInfo({ name, i })

  const latest = run(`npm view ${name} version`, true).toString('utf-8').split('\n')[0]
  const usedVersion = fullList[name]
  const used = usedVersion.includes('^') ? usedVersion.slice(1) : usedVersion

  if (used[0] !== latest[0]) table.push({ package: name, used, latest })
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
  if (table.length) console.table(table)
}

function clearConsole() {
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}
