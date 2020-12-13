const adjustPkgJson = require('../../modules/adjustPkgJson')
const fs = require('fs-extra')
const path = require('path')
const tempFolder = path.resolve(__dirname, 'temp-adjust-pkg-json-test')


describe('adjustPkgJson', () => {
  it('should adjust `package.json` to have specific (^) versions', () => {
    const dep1 = '1'
    const dep2 = '2'
    const devDep1 = '3'
    const devDep2 = '4'
    const pkgJson = JSON.stringify({
      dependencies: { dep1, dep2 },
      devDependencies: { devDep1, devDep2 }
    }, null, 2)

    // Create temporary folders & files to play with.
    fs.ensureFileSync(`${tempFolder}/package.json`)
    fs.ensureFileSync(`${tempFolder}/node_modules/dep1/package.json`)
    fs.ensureFileSync(`${tempFolder}/node_modules/dep2/package.json`)
    fs.ensureFileSync(`${tempFolder}/node_modules/devDep1/package.json`)
    fs.ensureFileSync(`${tempFolder}/node_modules/devDep2/package.json`)

    // Write the contents of the files.
    fs.writeFileSync(`${tempFolder}/package.json`, pkgJson, 'utf8')
    fs.writeFileSync(`${tempFolder}/node_modules/dep1/package.json`, JSON.stringify({ version: `${dep1}.0.1`}), 'utf8')
    fs.writeFileSync(`${tempFolder}/node_modules/dep2/package.json`, JSON.stringify({ version: `${dep2}.6.9`}), 'utf8')
    fs.writeFileSync(`${tempFolder}/node_modules/devDep1/package.json`, JSON.stringify({ version: `${devDep1}.1.0`}), 'utf8')
    fs.writeFileSync(`${tempFolder}/node_modules/devDep2/package.json`, JSON.stringify({ version: `${devDep2}.6.7`}), 'utf8')

    adjustPkgJson(tempFolder)
    const content = fs.readFileSync(`${tempFolder}/package.json`, 'utf8')
    const { dependencies, devDependencies } = fs.readJSONSync(`${tempFolder}/package.json`)

    // Remove all temporary files.
    fs.removeSync(tempFolder)

    expect(content).toMatchSnapshot()
    expect(dependencies.dep1).toBe('^1.0.1')
    expect(dependencies.dep2).toBe('^2.6.9')
    expect(devDependencies.devDep1).toBe('^3.1.0')
    expect(devDependencies.devDep2).toBe('^4.6.7')
  })
})
