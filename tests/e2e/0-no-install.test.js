const path = require('path')
const run = require('../../modules/run')
const mainPath = path.resolve(__dirname, '../../')
const appPath = `${mainPath}/${appPath}`


describe('the --noInstall option', () => {
  describe('cna <appName> --noInstall', () => {
    const appName = '0-cna-appname-noinstall-test'

    beforeAll(() => run(`node ${mainPath}/main.js ${appName} --noInstall`))

    it('should create a project in the <appName> directory', () => {
      expect(fs.existsSync(appPath)).toBe(true)
    })

    it('should not install node_modules', () => {
      expect(fs.existsSync(`${appPath}/node_modules`)).toBe(false)
    })

    it('should not include `package-lock.json`', () => {
      expect(fs.existsSync(`${appPath}/package-lock.json`)).toBe(false)
    })

    it('should not adjust `package.json`', () => {
      const pkgJson = fs.readJSONSync(`${appPath}/package.json`)
      const hasUnspecifiedVersions = Object.values(pkgJson.devDependencies).every(version => {
        if (version.startsWith('^')) return !version.includes('.')
        return version === 'latest'
      })

      expect(hasUnspecifiedVersions).toBe(true)
    })
  })

  describe('cna <appName> --noInstall [options]', () => {
    const appName = '0-cna-appname-noinstall-options-test'
  })
})
