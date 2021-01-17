const path = require('path')
const fs = require('fs-extra')
const noInstall = process.env.NO_INSTALL ? '--noInstall' : ''
const run = require('../../modules/run')
const filesAndFolders = require('./config/filesAndFolders')
const jsFilesAreValid = require('./helpers/jsFilesAreValid')
const {
  listFoldersInTree,
  foldersFromConfig,
  listIgnoredFoldersFromConfig,
  absolutePathConfig,
  listFolderContents,
} = require('./helpers/folderFileHelper')

describe('cli - React + Express project', () => {
  const appName = path.parse(__filename).name
  const mainPath = path.resolve(__dirname, '../../')
  const appPath = `${mainPath}/${appName}`

  beforeAll(() => {
    run(`node ${mainPath}/main.js ${appName} --express ${noInstall}`)
  })

  afterAll(() => {
    !process.env.REMAIN && fs.removeSync(appPath)
  })

  it('should create a project in the <appName> directory', () => {
    expect(fs.existsSync(appPath)).toBe(true)
  })

  it('should contain the expected folders and no others', () => {
    const expectedFolders = foldersFromConfig(
      appPath,
      filesAndFolders.cnaExpress,
    )
    const ignores = listIgnoredFoldersFromConfig(
      appPath,
      filesAndFolders.cnaExpress,
    )
    const actualFolders = listFoldersInTree(appPath, {ignores})

    expect(expectedFolders.sort()).toEqual(actualFolders.sort())
  })

  it('should contain the expected files and no others', () => {
    const config = absolutePathConfig(appPath, filesAndFolders.cnaExpress)

    Object.keys(config).forEach(folder => {
      const filesInFolder = listFolderContents(folder, {
        files: true,
        namesOnly: true,
      })

      expect(filesInFolder.sort()).toEqual(config[folder].sort())
    })
  })

  it('should produce valid JavaScript files with no parsing errors', () => {
    expect(jsFilesAreValid(appPath, 'cnaExpress')).toBe(true)
  })

  describe('contents of files created', () => {
    let i = 0
    const config = absolutePathConfig(appPath, filesAndFolders.cnaExpress)
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
          'dependencies',
          'scripts',
          'main',
        ]

        expect(Object.keys(pkgJson).sort()).toEqual(fields.sort())
      })

      it('should have the correct field values (aside from "devDependencies" / "dependencies")', () => {
        expect(pkgJson.name).toBe(appName)
        expect(pkgJson.version).toBe('0.1.0')
        expect(pkgJson.description).toBe('')
        expect(pkgJson.keywords).toEqual([])
        expect(pkgJson.author).toBe('')
        expect(pkgJson.email).toBe('')
        expect(pkgJson.repository).toBe('')
        expect(pkgJson.license).toBe('ISC')
        expect(pkgJson.browserslist.sort()).toEqual(
          ['>0.25%', 'not ie 11', 'not op_mini all'].sort(),
        )

        const scripts = {
          build:
            'cross-env NODE_ENV=production webpack --mode production --env prod',
          'build:dev':
            'cross-env NODE_ENV=development webpack --mode development --env dev',
          local: 'npm run server:api',
          'server:dev': 'webpack serve --mode development --progress --env dev',
          'server:api': 'nodemon server.js',
          start:
            'cross-env NODE_ENV=development npm-run-all --parallel server:*',
        }

        expect(pkgJson.scripts).toEqual(scripts)
      })

      it('should populate "devDependencies" correctly', () => {
        const deps = require('./config/dependencies')
        const {devDependencies} = deps.express
        const {latestPackages} = deps

        // 1. All the packages match.
        const installedPackages = Object.keys(pkgJson.devDependencies)
        const expectedPackages = Object.keys(devDependencies)
        expect(installedPackages.sort()).toEqual(expectedPackages.sort())

        // 2. All the package versions match.
        installedPackages.forEach(pkg => {
          const installedVersion = pkgJson.devDependencies[pkg]
          const expectedVersion = devDependencies[pkg]

          if (noInstall) {
            expect(installedVersion).toBe(expectedVersion)
          } else if (expectedVersion === 'latest') {
            expect(installedVersion).not.toBe('latest')
            expect(latestPackages.includes(pkg)).toBe(true)
          } else {
            expect(installedVersion).toStartWith(expectedVersion, pkg)
          }
        })
      })

      it('should populate "dependencies" correctly', () => {
        const deps = require('./config/dependencies')
        const {dependencies} = deps.express
        const {latestPackages} = deps

        // 1. All the packages match.
        const installedPackages = Object.keys(pkgJson.dependencies)
        const expectedPackages = Object.keys(dependencies)
        expect(installedPackages.sort()).toEqual(expectedPackages.sort())

        // 2. All the package versions match.
        installedPackages.forEach(pkg => {
          const installedVersion = pkgJson.dependencies[pkg]
          const expectedVersion = dependencies[pkg]

          if (noInstall) {
            expect(installedVersion).toBe(expectedVersion)
          } else if (expectedVersion === 'latest') {
            expect(installedVersion).not.toBe('latest')
            expect(latestPackages.includes(pkg)).toBe(true)
          } else {
            expect(installedVersion).toStartWith(expectedVersion, pkg)
          }
        })
      })
    })

    describe('webpack.config.js', () => {
      if (process.env.NO_INSTALL) return

      let wpConfigDev
      let wpConfigProd

      beforeAll(() => {
        /*
          Why is this in the `beforeAll` fxn?
          -----------------------------------
          Jest executes *all* `describe` functions before running any tests in them.
          At the time of reading `describe`, the project hasn't been created yet
          and `fs.readJSONSync` will throw an error. Placing it in here will
          ensure it's read *after* the project was created. And doing it inside
          a `beforeAll` vs a `beforeEach` will ensure it only happens once.
        */
        const webpackConfig = require(`${appPath}/webpack.config`)
        wpConfigDev = webpackConfig({prod: false})
        wpConfigProd = webpackConfig({prod: true})
      })

      it('should have the correct top-level properties and file contents', () => {
        const keys = [
          'mode',
          'bail',
          'context',
          'entry', // Not a primative value.
          'output', // Not a primative value.
          'module', // Not a primative value.
          'resolve', // Not a primative value.
          'optimization', // Not a primative value.
          'plugins', // Not a primative value.
          'devServer', // Not a primative value.
          'devtool',
          'target',
        ]

        expect(Object.keys(wpConfigDev).sort()).toEqual(keys.sort())
        expect(Object.keys(wpConfigProd).sort()).toEqual(keys.sort())
        expect(wpConfigDev).toMatchSnapshot()
        expect(wpConfigProd).toMatchSnapshot()
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
