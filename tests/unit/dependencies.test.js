const dependencies = require('../../modules/dependencies')

// Non-server combos.
const noOptions = dependencies({})
const redux = dependencies({ redux: 1 })
const router = dependencies({ router: 1 })
const reduxRouter = dependencies({ redux: 1, router: 1 })
const nonServerCombos = [noOptions, redux, router, reduxRouter]

// Server combos.
const server = dependencies({ server: 1 })
const serverRedux = dependencies({ server: 1, redux: 1 })
const serverRouter = dependencies({ server: 1, router: 1 })
const serverReduxRouter = dependencies({ server: 1, router: 1, redux: 1 })
const mongo = dependencies({ server: 1, mongo: 1 }) // Server is always true if mongo is true
const mongoRedux = dependencies({ server: 1, mongo: 1, redux: 1 })
const mongoRouter = dependencies({ server: 1, mongo: 1, router: 1 })
const mongoReduxRouter = dependencies({ server: 1, mongo: 1, router: 1, redux: 1 })
const nonMongoServerCombos = [server, serverRedux, serverRouter, serverReduxRouter]
const mongoServerCombos = [mongo, mongoRedux, mongoRouter, mongoReduxRouter]
const allServerCombos = nonMongoServerCombos.concat(mongoServerCombos)

const plainDevDeps = {
  // MAIN
  'react': '^17',
  'react-dom': '^17',
  'sassyons': 'latest',

  // POSTCSS
  'postcss-loader': '^4',
  'postcss': '^8',
  'cssnano': '^4',
  '@fullhuman/postcss-purgecss': '^3',
  'purgecss-whitelister': 'latest',
  'postcss-combine-media-query': '^1',
  'postcss-combine-duplicated-selectors': '^10',
  'autoprefixer': '^10',
  'css-declaration-sorter': '^6',

  // WEBPACK
  'webpack': '^5',
  'webpack-cli': '^4',
  'webpack-dev-server': '^3',
  'mini-css-extract-plugin': '^1',
  'clean-webpack-plugin': '^3',
  'html-webpack-plugin': '^5.0.0-beta',
  'file-loader': '^6',
  'css-loader': '^5',
  'sass': '^1',
  'sass-loader': '^10',
  'style-loader': '^2',
  'terser-webpack-plugin': '^5',
  '@pmmmwh/react-refresh-webpack-plugin': '^0',

  // BABEL
  'babel-loader': '^8',
  '@babel/core': '^7',
  '@babel/preset-env': '^7',
  '@babel/preset-react': '^7',
  '@babel/plugin-proposal-object-rest-spread': '^7',
  '@babel/plugin-proposal-class-properties': '^7',
  '@babel/plugin-syntax-dynamic-import': '^7',
  '@babel/plugin-proposal-optional-chaining': '^7',
  '@babel/plugin-proposal-nullish-coalescing-operator': '^7',
  'core-js': '^3',
  'regenerator-runtime': '^0',

  // OTHER
  'chalk': '^4',
  'cross-env': '^7',
  'npm-run-all': '^4',

  // This is also below in `serverDependencies`.
  // It does not get included here when the user requires a server.
  'dotenv': /* !server && */ '^8',
}

const plainServerDeps = {
  // SERVER
  'chalk': '^4',
  'express': '^4',
  'helmet': '^3',
  'compression': '^1',
  'body-parser': '^1',
  'nodemon': '^2',
  'dotenv': '^8', // This is also conditionally above in `devDependencies`.
}

const plainMongoDeps = {
  'chalk': '^4',
  'mongodb': '^3',
  'saslprep': '^1',
  'connect-mongo': '^3',
  'express-session': '^1',
}


describe('dependencies', () => {
  describe('general assertions', () => {
    it('should export an object with `devDependencies` and `serverDependencies` properties', () => {
      // forEach'ing over these arrays seperately so it's easier to debug when one fails.
      nonServerCombos.forEach(obj => {
        expect(obj.hasOwnProperty('devDependencies')).toBe(true)
        expect(obj.hasOwnProperty('serverDependencies')).toBe(true)
      })

      allServerCombos.forEach(obj => {
        expect(obj.hasOwnProperty('devDependencies')).toBe(true)
        expect(obj.hasOwnProperty('serverDependencies')).toBe(true)
      })
    })
  })

  describe('non-server combos', () => {
    it('should export `serverDependencies` as an empty object for all non-server combinations', () => {
      nonServerCombos.forEach(({ serverDependencies }) => {
        expect(serverDependencies).toEqual({})
      })
    })

    describe('no options', () => {
      it('should export the correct data', () => {
        expect(noOptions).toMatchSnapshot()
      })
    })

    describe('redux', () => {
      it('should export the correct data', () => {
        expect(redux).toMatchSnapshot()
      })
    })

    describe('router', () => {
      it('should export the correct data', () => {
        expect(router).toMatchSnapshot()
      })
    })

    describe('redux & router', () => {
      it('should export the correct data', () => {
        expect(reduxRouter).toMatchSnapshot()
      })
    })
  })

  describe('server combos', () => {
    describe('non-mongo options', () => {
      describe('server', () => {
        it('should export the correct data', () => {
          expect(server).toMatchSnapshot()
        })
      })

      describe('serverRedux', () => {
        it('should export the correct data', () => {
          expect(serverRedux).toMatchSnapshot()
        })
      })

      describe('serverRouter', () => {
        it('should export the correct data', () => {
          expect(serverRouter).toMatchSnapshot()
        })
      })

      describe('serverReduxRouter', () => {
        it('should export the correct data', () => {
          expect(serverReduxRouter).toMatchSnapshot()
        })
      })
    })

    describe('mongo-options', () => {
      describe('mongo', () => {
        it('should export the correct data', () => {
          expect(mongo).toMatchSnapshot()
        })
      })

      describe('mongoRedux', () => {
        it('should export the correct data', () => {
          expect(mongoRedux).toMatchSnapshot()
        })
      })

      describe('mongoRouter', () => {
        it('should export the correct data', () => {
          expect(mongoRouter).toMatchSnapshot()
        })
      })

      describe('mongoReduxRouter', () => {
        it('should export the correct data', () => {
          expect(mongoReduxRouter).toMatchSnapshot()
        })
      })
    })
  })
})
