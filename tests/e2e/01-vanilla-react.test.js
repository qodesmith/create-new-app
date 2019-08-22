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
  listFolderContents
} = require('./helpers/folderFileHelper')


describe('cli - vanilla React project', () => {
  const appName = '01-vanilla-react-test' // Ensure the folder ends in `test` to be git ignored.
  const mainPath = path.resolve(__dirname, '../../')
  const appPath = `${mainPath}/${appName}`

  beforeAll(() => {
    run(`node ${mainPath}/main.js ${appName} ${noInstall}`)
  })

  // Remove the directory after all tests are complete.
  afterAll(() => {
    !process.env.REMAIN && fs.removeSync(appPath)
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

  it('should produce valid JavaScript files with no parsing errors', () => {
    expect(jsFilesAreValid(appPath, 'cna')).toBe(true)
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
        /*
          Why is this in the `beforeAll` fxn?
          -----------------------------------
          Jest executes *all* `describe` functions before running any tests in them.
          At the time of reading `describe`, the project hasn't been created yet
          and `fs.readJSONSync` will throw an error. Placing it in here will
          ensure it's read *after* the project was created. And doing it inside
          a `beforeAll` vs a `beforeEach` will ensure it only happens once.
        */
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
          'scripts'
        ]

        expect(Object.keys(pkgJson).sort()).toEqual(fields.sort())
      })

      it('should not have a "dependencies" field', () => {
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

        const scripts = {
          build: 'cross-env NODE_ENV=production webpack --mode production --env.prod',
          start: 'cross-env NODE_ENV=development webpack-dev-server --mode development --env.dev --progress'
        }

        expect(pkgJson.scripts).toEqual(scripts)
      })

      it('should populate "devDependencies" correctly', () => {
        const deps = require('./config/dependencies')
        const { devDependencies } = deps.vanilla
        const { latestPackages } = deps

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
    })

    describe('webpack.config.js', () => {
      // let webpackConfig
      // beforeAll(() => {
      //   /*
      //     Why is this in the `beforeAll` fxn?
      //     -----------------------------------
      //     Jest executes *all* `describe` functions before running any tests in them.
      //     At the time of reading `describe`, the project hasn't been created yet
      //     and `fs.readJSONSync` will throw an error. Placing it in here will
      //     ensure it's read *after* the project was created. And doing it inside
      //     a `beforeAll` vs a `beforeEach` will ensure it only happens once.
      //   */
      //   webpackConfig = require(`${appPath}/webpack.config`)
      // })

      // it('should do something', () => {
      //   const x = webpackConfig({})
      //   console.log('WHAT IS THIS:', x)
      // })
    })

    // http://bit.ly/2DzX08c - `describe.each`
    describe.each(folderNames)('%s', () => {
      const folderPath = folderPaths[i++]
      const files = config[folderPath]

      files.forEach(file => {
        // These files are tested separately.
        if (file === 'package.json' || file === 'webpack.config.js') return

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
