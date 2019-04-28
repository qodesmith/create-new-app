const path = require('path')
const fs = require('fs-extra')
const noInstall = process.argv.includes('noInstall') ? '--noInstall' : ''
const run = require('../../modules/run')
const filesAndFolders = require('./config/filesAndFolders')
const {
  listFoldersInTree,
  foldersFromConfig,
  listIgnoredFoldersFromConfig,
  absolutePathConfig,
  listFolderContents
} = require('./helpers/folderFileHelper')


describe('cna <appName> - creates a vanilla React project automatically', () => {
  // const originalConsoleLog = console.log
  const appName = '1-cna-appname-test'
  const mainPath = path.resolve(__dirname, '../../')
  const appPath = `${mainPath}/${appName}`

  beforeAll(() => {
    // console.log = () => {} // So we don't see the generator puke in the console.
    run(`node ${mainPath}/main.js ${appName} ${noInstall}`)
  })

  // Remove the directory after all tests are complete.
  afterAll(() => {
    fs.removeSync(appPath)
    // console.log = originalConsoleLog
  })

  it('should create a project in the <appName> directory', () => {
    expect(fs.existsSync(appPath)).toBe(true)
  })

  it('should contain the expected folders and no others', () => {
    const expectedFolders = foldersFromConfig(appPath, filesAndFolders.cna)
    const ignores = listIgnoredFoldersFromConfig(appPath, filesAndFolders.cna)
    const actualFolders = listFoldersInTree(appPath, { ignores })

    expect(expectedFolders.sort()).toEqual(actualFolders.sort())
  })

  it('should contain the expected files and no others', () => {
    const config = absolutePathConfig(appPath, filesAndFolders.cna)

    Object.keys(config).forEach(folder => {
      const filesInFolder = listFolderContents(folder, {
        files: true,
        namesOnly: true
      })

      expect(filesInFolder.sort()).toEqual(config[folder].sort())
    })
  })

  describe('contents of files created', () => {
    let i = 0
    const config = absolutePathConfig(appPath, filesAndFolders.cna)
    const folderPaths = Object.keys(config)
    const folderNames = folderPaths.map(folderPath => {
      const name = folderPath.split(`${appPath}`)[1]
      return `Folder - ${name || '/'}`
    })

    describe('package.json', () => {
      let pkgJson
      beforeAll(() => {
        pkgJson = fs.readJSONSync(`${appPath}/package.json`)
      })

      const { devDependencies } = require('./config/dependencies').vanilla

      it('should have the correct fields and only those fields', () => {
        const fields = [
          'name',
          'version',
          'description',
          'keywords',
          'author',
          'email',
          'repository',
          'license',
          'browserslist',
          'devDependencies',
          'scripts'
        ]

        expect(Object.keys(pkgJson).sort()).toEqual(fields.sort())
        expect(pkgJson.dependencies).toBe(undefined)
      })

      it('should have the correct field values (aside from "devDependencies")', () => {
        expect(pkgJson.name).toBe(appName)
        expect(pkgJson.version).toBe('0.1.0')
        expect(pkgJson.description).toBe('')
        expect(pkgJson.keywords).toEqual([])
        expect(pkgJson.author).toBe('')
        expect(pkgJson.email).toBe('')
        expect(pkgJson.repository).toBe('')
        expect(pkgJson.license).toBe('ISC')
        expect(pkgJson.browserslist.sort()).toEqual(['>0.25%', 'not ie 11', 'not op_mini all'].sort())

        const buildScript = 'cross-env NODE_ENV=production webpack --mode production --env.prod'
        const startScript = 'cross-env NODE_ENV=development webpack-dev-server --mode development --env.dev --progress'
        expect(Object.keys(pkgJson.scripts).sort()).toEqual(['build', 'start'])
        expect(pkgJson.scripts.build).toBe(buildScript)
        expect(pkgJson.scripts.start).toBe(startScript)
      })

      it('should populate "devDependencies" correctly', () => {
        const hasSpecificVersions = Object.values(pkgJson.devDependencies).every(version => {
          return version.startsWith('^') && version.length >= 6 // E.x. - ^1.2.3
        })

        expect(Object.keys(pkgJson.devDependencies).sort()).toEqual(devDependencies.sort())
        expect(hasSpecificVersions).toBe(!noInstall)
      })
    })

    // http://bit.ly/2DzX08c - `describe.each`
    describe.each(folderNames)('%s', () => {
      const folderPath = folderPaths[i++]
      const files = config[folderPath]

      files.forEach(file => {
        // `package.json` is tested separately.
        if (file === 'package.json') return

        // We don't test this file.
        if (file === 'package-lock.json') return

        it(`should populate "${file}" correctly`, () => {
          const fileContents = fs.readFileSync(`${folderPath}/${file}`, 'utf8')
          expect(fileContents).toMatchSnapshot()
        })
      })
    })
  })
})
