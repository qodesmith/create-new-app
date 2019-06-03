const chalk = require('chalk')
const formDependencies = require('./modules/dependencies')
const makeTable = require('./modules/makeTable')
const removeAnsiChars = require('./modules/removeAnsiChars')
const { devDependencies, serverDependencies } = formDependencies({ mongo: 1, redux: 1, router: 1, server: 1 })
const fullList = { ...devDependencies, ...serverDependencies }
const packages = Object.keys(fullList)
const keysLength = packages.length
const all = process.argv.some(arg => arg === '--all' || arg === 'all')

const RegistryClient = require('npm-registry-client')
const client = new RegistryClient()
const uri = 'https://registry.npmjs.org'
const params = { timeout: 1000 }

const promises = packages.map(name => {
  return new Promise(resolve => {
    const url = `${uri}/${name}/`
    client.get(url, params, (error, data, raw, res) => {
      if (error) return resolve({ name: `${chalk.yellow.bold('ERROR')} - ${name}`, error: true })

      const usedVersion = fullList[name]
      const latestVersion = data['dist-tags'].latest
      const [latestMajor] = latestVersion.split('.')
      const isDeprecated = !!data.versions[latestVersion].deprecated
      const used = usedVersion.includes('^') ? usedVersion.slice(1) : usedVersion
      name = isDeprecated ? `${chalk.bold.red('DEPRECATED:')} ${name}` : name

      if (all || isDeprecated || used !== latestMajor) {
        resolve({ name, used, latestVersion: chalk.green(latestVersion) })
      } else {
        resolve({ name: '' })
      }
    })
  })
})

Promise.all(promises).then(results => {
  const finalResults = results
    .sort((a, b) => {
      const name1 = removeAnsiChars(a.name)
      const name2 = removeAnsiChars(b.name)
      return name1 > name2 ? 1 : name1 < name2 ? -1 : 0
    })
    .reduce((acc, { name, used, latestVersion, error }) => {
      if (!name) return acc
      if (error) return [...acc, [name, '-', '-']]

      return [...acc, [name, used, latestVersion]]
    }, [[chalk.bold('PACKAGE'), chalk.bold('USED'), chalk.bold('LATEST')]])

  // http://bit.ly/2Z7GZ1M - clear the console.
  console.log('\x1Bc')

  // Using a quick `setTimeout` here to ensure the console was cleared.
  setTimeout(() => {
    const totalChecked = results.filter(item => !item.error).length
    const checked = chalk[totalChecked === keysLength ? 'green' : 'yellow'](totalChecked)

    if (finalResults.length === 1) {
      console.log('All packages up to date!')
    } else {
      const total = chalk.green(keysLength)
      console.log(`${total} total packages, ${checked} checked!`)
      console.log(makeTable(finalResults, { centered: true }))
    }
  }, 100)
})
