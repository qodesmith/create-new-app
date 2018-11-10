const readline = require('readline')
const run = require('./modules/run')
const formDependencies = require('./modules/dependencies')
const { devDependencies, serverDependencies } = formDependencies(true, true, true)
const fullList = { ...devDependencies, ...serverDependencies }

console.log('Generating table...\n')
const table = []
Object.keys(fullList).forEach((name, i, arr) => {
  logInfo(i, arr)

  const latest = run(`npm view ${name} version`, true).toString('utf-8').split('\n')[0]
  const usedVersion = fullList[name]
  const used = usedVersion.includes('^') ? usedVersion.slice(1) : usedVersion

  if (used[0] !== latest[0]) table.push({ package: name, used, latest })
})

if (!table.length) console.log('All packages up to date!')

function logInfo(i, arr) {
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
  console.log(`${i + 1} of ${arr.length}`)
  if (table.length) console.table(table)
}
