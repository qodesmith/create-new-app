/*
  This file is a way for me to check the versions of dependencies
  that Create New App uses to create React applications.
  It's simply for maintenance reasons concerning this library.
*/

const registryFetch = require('npm-registry-fetch')
const chalk = require('chalk')
const formDependencies = require('./modules/dependencies')
const makeTable = require('./modules/makeTable')
const {devDependencies, serverDependencies} = formDependencies({
  mongo: 1,
  router: 1,
  server: 1,
})
const fullList = {...devDependencies, ...serverDependencies}
const packages = Object.keys(fullList).sort()
const keysLength = packages.length
const all = process.argv.some(arg => arg === '--all' || arg === 'all')

const promises = packages.map(pkg => {
  return registryFetch
    .json(pkg)
    .then(data => {
      const usedVersion = fullList[pkg]
      const latestVersion = data['dist-tags'].latest
      const [latestMajor] = latestVersion.split('.')
      const isDeprecated = !!data.versions[latestVersion].deprecated
      const used = usedVersion.includes('^')
        ? usedVersion.slice(1)
        : usedVersion
      const name = isDeprecated
        ? `${chalk.bold.red('DEPRECATED:')} ${pkg}`
        : pkg

      if (all || isDeprecated || used !== latestMajor) {
        return {name, used, latestVersion: chalk.green(latestVersion)}
      } else {
        return {name: ''}
      }
    })
    .catch(() => ({
      name: `${chalk.yellow.bold('ERROR')} - ${pkg}`,
      error: true,
    }))
})

Promise.all(promises).then(results => {
  const finalResults = results.reduce(
    (acc, {name, used, latestVersion, error}) => {
      if (!name) return acc
      if (error) return [...acc, [name, '-', '-']]

      return [...acc, [name, used, latestVersion]]
    },
    [[chalk.bold('PACKAGE'), chalk.bold('USED'), chalk.bold('LATEST')]],
  )

  // http://bit.ly/2Z7GZ1M - clear the console.
  console.log('\x1Bc')

  // Using a quick `setTimeout` here to ensure the console was cleared.
  setTimeout(() => {
    const totalChecked = results.filter(item => !item.error).length
    const checked = chalk[totalChecked === keysLength ? 'green' : 'yellow'](
      totalChecked,
    )

    if (finalResults.length === 1) {
      console.log('All packages up to date!')
    } else {
      const total = chalk.green(keysLength)
      console.log(`${total} total packages, ${checked} checked!`)
      console.log(makeTable(finalResults, {centered: true}))
    }
  }, 100)
})
