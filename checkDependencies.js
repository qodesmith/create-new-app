const chalk = require('chalk')
const formDependencies = require('./modules/dependencies')
const makeTable = require('./modules/makeTable')
const { devDependencies, serverDependencies } = formDependencies({ mongo: 1, redux: 1, router: 1, server: 1 })
const fullList = { ...devDependencies, ...serverDependencies }
const packages = Object.keys(fullList)
const keysLength = packages.length
const all = process.argv.some(arg => arg === '--all')
const table = [[
  chalk.bold('PACKAGE'),
  chalk.bold('USED'),
  chalk.bold('LATEST')
]]

const RegistryClient = require('npm-registry-client')
const client = new RegistryClient()
const uri = 'https://registry.npmjs.org'
const params = { timeout: 1000 }

const promises = packages.map((name, i) => {
  return new Promise(resolve => {
    const url = `${uri}/${name}/`
    client.get(url, params, (error, data, raw, res) => {
      if (error) {
        table.push([`${chalk.yellow.bold('ERROR')} - ${name}`, '-', '-'])
        return resolve(null)
      }

      const usedVersion = fullList[name]
      const latestVersion = data['dist-tags'].latest
      const [latestMajor] = latestVersion.split('.')
      const isDeprecated = !!data.versions[latestVersion].deprecated
      const used = usedVersion.includes('^') ? usedVersion.slice(1) : usedVersion
      name = isDeprecated ? `${chalk.bold.red('DEPRECATED:')} ${name}` : name

      if (all || isDeprecated || used !== latestMajor) {
        table.push([name, used, chalk.green(latestVersion)])
      }

      resolve(true)
    })
  })
})

Promise.all(promises).then(results => {
  // https://gist.github.com/KenanSulayman/4990953
  console.log('\033c') // Clear the console. I believe this is the `ESC` ASCII character.

  // Using a quick `setTimeout` here to ensure the console was cleared.
  setTimeout(() => {
    const totalChecked = results.filter(Boolean).length
    const checked = chalk[totalChecked === keysLength ? 'green' : 'yellow'](totalChecked)

    if (!table.length) {
      console.log('All packages up to date!')
    } else {
      const total = chalk.green(keysLength)
      console.log(`${total} total packages, ${checked} checked!`)
      console.log(makeTable(table, { centered: true }))
    }
  }, 100)
})
