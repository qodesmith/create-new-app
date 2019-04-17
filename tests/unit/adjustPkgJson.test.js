const adjustPkgJson = require('../../modules/adjustPkgJson')
const fs = require('fs-extra')
const path = require('path')
const tempPath = path.resolve(__dirname, 'temp')
const pkgJson = JSON.stringify({
  dependencies: {
    dep1: '1',
    dep2: '2'
  },
  devDependencies: {
    devDep1: '3',
    devDep2: '4'
  }
}, null, 2)


describe('adjustPkgJson', () => {
  // Create temporary folders & files to play with.
  fs.ensureFileSync(`${tempPath}/package.json`)
  fs.ensureFileSync(`${tempPath}/node_modules/dep1/package.json`)
  fs.ensureFileSync(`${tempPath}/node_modules/dep2/package.json`)
  fs.ensureFileSync(`${tempPath}/node_modules/devDep1/package.json`)
  fs.ensureFileSync(`${tempPath}/node_modules/devDep2/package.json`)

  fs.writeFileSync(`${tempPath}/package.json`, pkgJson, 'utf8')
  fs.writeFileSync(`${tempPath}/node_modules/dep1/package.json`, JSON.stringify({ version: '1.0.1'}), 'utf8')
  fs.writeFileSync(`${tempPath}/node_modules/dep2/package.json`, JSON.stringify({ version: '2.6.9'}), 'utf8')
  fs.writeFileSync(`${tempPath}/node_modules/devDep1/package.json`, JSON.stringify({ version: '3.1.0'}), 'utf8')
  fs.writeFileSync(`${tempPath}/node_modules/devDep2/package.json`, JSON.stringify({ version: '4.6.7'}), 'utf8')

  adjustPkgJson(tempPath)
  const { dependencies, devDependencies } = fs.readJsonSync(`${tempPath}/package.json`)

  // Remove all temporary files.
  fs.removeSync(tempPath)

  it('should adjust `package.json` to have specific (^) versions', () => {
    const adjusted = [
      dependencies.dep1 === '^1.0.1',
      dependencies.dep2 === '^2.6.9',
      devDependencies.devDep1 === '^3.1.0',
      devDependencies.devDep2 === '^4.6.7'
    ].every(Boolean)

    expect(adjusted).toBe(true)
  })
})
