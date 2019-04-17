const path = require('path')
const fs = require('fs-extra')
const run = require('../../modules/run')
const indentFromZero = require('../../modules/indentFromZero')
const listFolderContents = require('./helpers/listFolderContents')


describe('cna <appName> - creates a vanilla React project automatically', () => {
  const originalConsoleLog = console.log
  const appName = '1-cna-appname-test'
  const mainPath = path.resolve(__dirname, '../../')
  const appPath = `${mainPath}/${appName}`

  beforeAll(() => {
    console.log = jest.fn()
    run(`node ${mainPath}/main.js ${appName}`, true)
  })

  // Remove the directory after all tests are complete.
  afterAll(() => {
    // fs.removeSync(appPath)
    console.log = originalConsoleLog
  })

  it('should create a project in the <appName> directory', () => {
    expect(fs.existsSync(appPath)).toBe(true)
  })

  it('should contain the correct folder structure', () => {
    const folders = [
      `${appPath}/.git`, // Hidden.
      `${appPath}/dist`,
      `${appPath}/node_modules`,
      `${appPath}/src`,
      `${appPath}/src/assets`,
      `${appPath}/src/components`,
      `${appPath}/src/styles`,
    ]

    folders.forEach(folder => expect(fs.existsSync(folder)).toBe(true))
  })

  // Ensure that there aren't other folders aside from the correct ones.
  it('should contain only the expected folders', () => {
    // Get a list of folders in each of our folders.
    const root = listFolderContents(appPath, { folders: true })
    const dist = listFolderContents(`${appPath}/dist`, { folders: true })
    const src = listFolderContents(`${appPath}/src`, { folders: true })
    const assets = listFolderContents(`${appPath}/src/assets`, { folders: true })
    const components = listFolderContents(`${appPath}/src/components`, { folders: true })
    const styles = listFolderContents(`${appPath}/src/styles`, { folders: true })

    expect(root.length).toBe(4) // This includes the hidden .git folder.
    expect(dist.length).toBe(0)
    expect(src.length).toBe(3)
    expect(assets.length).toBe(0)
    expect(components.length).toBe(0)
    expect(styles.length).toBe(0)
  })

  describe('files created', () => {
    describe('root', () => {
      it('should contain the correct files', () => {
        const rootFiles = listFolderContents(appPath, { files: true, namesOnly: true })
        const files = [
          '.env',
          '.gitignore',
          'after-compile-plugin.js',
          'package-lock.json',
          'package.json',
          'postcss.config.js',
          'README.md',
          'webpack.config.js'
        ]

        expect(rootFiles.sort()).toEqual(files.sort())
      })

      it('should populate `.env` with the correct variables', () => {
        const envContents = fs.readFileSync(`${appPath}/.env`, 'utf8')
        const { parse } = require(`${appPath}/node_modules/dotenv`)
        const parsed = parse(envContents)

        expect(parsed.APP_NAME).toBe(appName)
        expect(parsed.DEV_SERVER_PORT).toBe('8080')
      })

      it('should populate `package.json` correctly', () => {
        const pkgJson = fs.readJSONSync(`${appPath}/package.json`)
        const { devDependencies } = require('./helpers/dependencies').cnaDeps
        const hasSpecificVersions = Object.values(pkgJson.devDependencies).every(version => {
          return version.startsWith('^') && version.length === 6 // E.x. - ^1.2.3
        })

        expect(Object.keys(pkgJson).length).toBe(11)
        expect(pkgJson.name).toBe(appName)
        expect(pkgJson.version).toBe('0.1.0')
        expect(pkgJson.description).toBe('')
        expect(pkgJson.keywords).toEqual([])
        expect(pkgJson.author).toBe('')
        expect(pkgJson.email).toBe('')
        expect(pkgJson.repository).toBe('')
        expect(pkgJson.license).toBe('ISC')
        expect(pkgJson.browserslist.sort()).toEqual(['>0.25%', 'not ie 11', 'not op_mini all'].sort())
        expect(Object.keys(pkgJson.devDependencies).sort()).toEqual(devDependencies.sort())
        expect(hasSpecificVersions).toBe(true)
        expect(pkgJson.dependencies).toBe(undefined)
        expect(Object.keys(pkgJson.scripts).sort()).toEqual(['build', 'start'])
      })

      it('should populate `postcss.config.js` correctly', () => {
        const fileContents = fs.readFileSync(`${appName}/postcss.config.js`, 'utf8')
        const expectedContents = indentFromZero(`
          module.exports = {
            plugins: [
              // https://goo.gl/igXRk6 - explains why we're using purge-css here and not as a Webpack plugin.
              isProd && purgeCss({
                // Optionally whitelist 3rd party libraries:
                // whitelist: whitelister('./node_modules/some-library/styles.css'),
                content: globAll.sync([
                  './src/**/*.js',
                  './src/**/*.jsx',
                  './src/index.ejs'
                ], { absolute: true }),
                keyframes: false // https://goo.gl/18L7bj
              }),
              noComment(),
              mqPacker({ sort: true }),
              combineSelectors({ removeDuplicatedProperties: true }),
              autoprefixer(),
              colormin(),
              sorter()
            ].filter(Boolean)
          }
        `, { both: true })

        expect(fileContents.includes(expectedContents)).toBe(true)
      })

      it('should populate `README.md` correctly', () => {
        const readme = fs.readFileSync(`${appName}/README.md`, 'utf8')
        const expectedContents = 'This project was created with [Create New App](https://github.com/qodesmith/create-new-app).\n'

        expect(readme).toBe(expectedContents)
      })

      it('should populate `wepback.config.js` correctly', () => {
        const webpackConfigFxn = require(`${appPath}/webpack.config`)
        const config = webpackConfigFxn({})
        const envContents = fs.readFileSync(`${appPath}/.env`, 'utf8')
        const { parse } = require(`${appPath}/node_modules/dotenv`)
        const parsed = parse(envContents)


        expect(config.mode).toBe('development')
        expect(config.context).toBe(`${appPath}/src`)
        expect(config.entry).toEqual([`${appPath}/src/entry.js`])

        // `output`
        expect(config.output.filename).toBe('[name].[hash].bundle.js')
        expect(config.output.path).toBe(`${appPath}/dist`)
        expect(config.output.pathinfo).toBe(true)
        expect(config.output.publicPath).toBe('/')

        expect(config.module.rules.length).toBe(4)

        // .js / .jsx
        expect(config.module.rules[0]).toEqual({
          test: /\.(js|jsx)$/,
          include: `${appPath}/src`,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      useBuiltIns: 'entry',
                      corejs: {
                        version: 3,
                        proposals: true
                      }
                    }
                  ]
                ],
                plugins: [
                  '@babel/plugin-proposal-object-rest-spread',
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-syntax-dynamic-import'
                ]
              }
            }
          ]
        })

        // .scss / .css
        expect(config.module.rules[1]).toEqual({
          test: /\.(scss|css)$/,
          include: `${appPath}/src`,
          use: [
            require(`${appPath}/node_modules/mini-css-extract-plugin`).loader,
            {
              loader: 'fast-css-loader',
              options: {
                importLoaders: 2
              }
            },
            'postcss-loader',
            {
              loader: 'fast-sass-loader',
              options: {
                includePaths: [
                  'node_modules/sassyons'
                ],
                outputStyle: 'expanded'
              }
            }
          ]
        })

        // Fonts.
        expect(config.module.rules[2]).toEqual({
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          include: `${appPath}/src`,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]'
              }
            }
          ]
        })

        // Images.
        expect(config.module.rules[3]).toEqual({
          test: /\.(png|svg|jpg|gif)$/,
          include: `${appPath}/src/assets`,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]'
              }
            }
          ]
        })

        // `resolve`
        expect(config.resolve).toEqual({
          alias: {
            components: `${appPath}/src/components`,
            assets: `${appPath}/src/assets`
          },
          extensions: ['.js', '.jsx', '.json', '.scss']
        })

        // `optimization`
        expect(Object.keys(config.optimization).length).toBe(1)
        expect(config.optimization.minimizer.length).toBe(1)
        expect(config.optimization.minimizer[0] instanceof require(`${appPath}/node_modules/terser-webpack-plugin`)).toBe(true)

        // `plugins`
        expect(config.plugins.length).toBe(5)
        expect(config.plugins[0] instanceof require(`${appPath}/node_modules/webpack`).DefinePlugin).toBe(true)
        expect(config.plugins[1] instanceof require(`${appPath}/node_modules/mini-css-extract-plugin`)).toBe(true)
        expect(config.plugins[2] instanceof require(`${appPath}/node_modules/clean-webpack-plugin`)).toBe(true)
        expect(config.plugins[3] instanceof require(`${appPath}/node_modules/html-webpack-plugin`)).toBe(true)
        expect(config.plugins[4] instanceof require(`${appPath}/after-compile-plugin`)).toBe(true)

        // `devServer`
        expect(config.devServer).toEqual({
          contentBase: `${appPath}/dist`,
          historyApiFallback: true,
          host: '0.0.0.0',
          open: true,
          port: parsed.DEV_SERVER_PORT,
          public: `http://localhost:${parsed.DEV_SERVER_PORT}`,
          proxy: {}
        })

        expect(config.devtool).toBe('cheap-module-eval-source-map')
        expect(config.target).toBe('web')
      })
    })

    describe('dist', () => {
      it('should contain the correct files', () => {
        const distFiles = listFolderContents(`${appPath}/dist`, { files: true, namesOnly: true })
        const files = ['favicon.ico', 'robots.txt']
        expect(distFiles.sort()).toEqual(files.sort())
      })

      it('should not populate `robots.txt` with any content', () => {
        const fileContents = fs.readFileSync(`${appPath}/dist/robots.txt`, 'utf8')
        expect(fileContents).toBe('')
      })
    })

    describe('src', () => {
      it('should contain the correct files', () => {
        const srcFiles = listFolderContents(`${appPath}/src`, { files: true, namesOnly: true })
        const files = ['entry.js', 'index.ejs']
        expect(srcFiles.sort()).toEqual(files.sort())
      })

      it('should populate `entry.js` correctly', () => {
        const fileContents = fs.readFileSync(`${appPath}/src/entry.js`, 'utf8')
        const expectedContents = indentFromZero(`
          /*
            https://goo.gl/mw8Ntd - \`@babel/polyfill\` has been deprecated.
            If you need to polyfill certain JS features, uncomment the two imports below.
            Be sure to adjust the \`browserslist\` field in your \`package.json\` file.
          */
          // import 'core-js/stable'
          // import 'regenerator-runtime/runtime' // Needed to polyfill async / await.

          // Import our top-level sass file.
          import './styles/styles.scss'

          // Import React.
          import React from 'react'
          import ReactDOM from 'react-dom'

          // Import our top-level component.
          import App from 'components/App'

          // Top-level classes on the body. Feel free to remove / change.
          document.body.className = 'bg-black-80 fw4 white-80'

          // Mount our app.
          ReactDOM.render(
            <App />,
            document.querySelector('#app')
          )
        `, { first: true })

        expect(fileContents).toBe(expectedContents)
      })

      it('should populate `index.ejs` correctly', () => {
        const fileContents = fs.readFileSync(`${appPath}/src/index.ejs`, 'utf8')
        const expectedContents = indentFromZero(`
          <!DOCTYPE html>
          <html lang="en-US">
          <head>
            <title><%= htmlWebpackPlugin.options.title %></title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="theme-color" content="#000000">

            <% if (htmlWebpackPlugin.options.description) { %>
            <meta name="description" content="<% htmlWebpackPlugin.options.description %>">
            <% } %>

            <% if (htmlWebpackPlugin.options.mobileThemeColor) { %>
            <meta name="theme-color" content="<% htmlWebpackPlugin.options.mobileThemeColor %>">
            <meta name="apple-mobile-web-app-status-bar-style" content="<% htmlWebpackPlugin.options.mobileThemeColor %>">
            <% } %>

            <link href="/favicon.ico" rel="shortcut icon" type="image/x-icon" />
          </head>
          <body>
            <div id="app"></div>
          </body>
          </html>
        `, { first: true })

        expect(fileContents).toBe(expectedContents)
      })
    })

    describe('src/assets', () => {
      it('should not contain any files', () => {
        const assetsFiles = listFolderContents(`${appPath}/src/assets`, { files: true, namesOnly: true })
        expect(assetsFiles.length).toBe(0)
      })
    })

    describe('src/components', () => {
      it('should contain the correct files', () => {
        const componentsFiles = listFolderContents(`${appPath}/src/components`, { files: true, namesOnly: true })
        const files = ['App.jsx']
        expect(componentsFiles).toEqual(files)
      })

      it('should populate `App.jsx` correctly', () => {
        const fileContents = fs.readFileSync(`${appPath}/src/components/App.jsx`, 'utf8')
        const expectedContents = indentFromZero(`
          const App = () => (
            <>
              <header className='pv5 bg-gold black-80'>
                <h1 className='mt0 mb1 tc'>Create New App</h1>
                <div className='tc ttc'>by the Qodesmith</div>
              </header>
              <div className='pt4 pb1 tc'>Go save the world with JavaScript</div>
              <div className='tc'>and edit <code>src/components/<span className='b'>App.jsx</span></code>!</div>
            </>
          )

          export default App
        `, { both: true })

        expect(fileContents.includes(expectedContents)).toBe(true)
      })
    })

    describe('src/styles', () => {
      it('should contain the correct files', () => {
        const stylesFiles = listFolderContents(`${appPath}/src/styles`, { files: true, namesOnly: true })
        const files = ['_global.scss', 'styles.scss']
        expect(stylesFiles.sort()).toEqual(files.sort())
      })

      it('should populate `_global.scss` correctly', () => {
        const fileContents = fs.readFileSync(`${appPath}/src/styles/_global.scss`, 'utf8')
        const expectedContents = indentFromZero(`
          /*
            px <-> em: http://pxtoem.com/
          */

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;

            // https://goo.gl/YK3TNB
            // size/line-height | family
            font: 16px/1 'Open Sans', Arial, Helvetica, sans-serif;
          }
        `, { first: true })

        expect(fileContents).toBe(expectedContents)
      })

      it('should populate `styles.scss` correctly', () => {
        const fileContents = fs.readFileSync(`${appPath}/src/styles/styles.scss`, 'utf8')
        const totalImports = fileContents
          .split('\n')
          .filter(line => line.startsWith(`@import '`))

        expect(fileContents.includes(`@import '~sassyons/scss/sassyons';`)).toBe(true)
        expect(fileContents.includes(`@import 'global';`)).toBe(true)
        expect(totalImports.length).toBe(2)
      })
    })
  })
})
