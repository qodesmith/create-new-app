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
  react: '^16',
  'react-dom': '^16',
  sassyons: '^3',

  // POSTCSS
  'postcss-loader': '^3',
  postcss: '^7',
  cssnano: '^4',
  '@fullhuman/postcss-purgecss': '^2',
  'purgecss-whitelister': 'latest',
  'postcss-combine-media-query': '^1',
  'postcss-combine-duplicated-selectors': '^8',
  autoprefixer: '^9',
  'css-declaration-sorter': '^5',

  // WEBPACK
  webpack: '^4',
  'webpack-cli': '^3',
  'webpack-dev-server': '^3',
  'mini-css-extract-plugin': '^0',
  'clean-webpack-plugin': '^3',
  'html-webpack-plugin': '^4',
  'glob-all': 'latest',
  'file-loader': '^6',
  'css-loader': '^3',
  'fast-css-loader': '^1',
  'sass-loader': '^8',
  'fast-sass-loader': '^1',
  'node-sass': '^4',
  'terser-webpack-plugin': '^2',

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
  'cross-env': '^7',
  'npm-run-all': 'latest',

  // This is also below in `serverDependencies`.
  // It does not get included here when the user requires a server.
  dotenv: /* !server && */ '^8'
}

const plainServerDeps = {
  // SERVER
  chalk: '^3',
  express: '^4',
  helmet: '^3',
  compression: '^1',
  'body-parser': '^1',
  nodemon: 'latest', // Always install latest.
  dotenv: '^8' // This is also conditionally above in `devDependencies`.
}

const plainMongoDeps = {
  mongodb: '^3',
  saslprep: '^1',
  'connect-mongo': '^3',
  'express-session': '^1'
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

  /*
    Explicitly check the `dotenv` package since it flip-flops between
    being included in `devDependencies` or `serverDependencies`.
  */
  describe('dotenv package', () => {
    it('should be included in `devDependencies` for all non-server combinations', () => {
      nonServerCombos.forEach(({ devDependencies }) => {
        expect(devDependencies.dotenv).toBeTruthy()
      })
    })

    it('should be included in `serverDependencies` for all server combinations', () => {
      allServerCombos.forEach(({ serverDependencies }) => {
        expect(serverDependencies.dotenv).toBeTruthy()
      })
    })

    it('should not be included in `devDependencies` for all server combinations', () => {
      allServerCombos.forEach(({ devDependencies }) => {
        expect(devDependencies.dotenv).not.toBeTruthy()
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
      it('should export the correct `devDependencies`', () => {
        expect(noOptions.devDependencies).toEqual(plainDevDeps)
      })

      it('should not export any of the redux or react-router packages in `devDependencies`', () => {
        expect(noOptions.devDependencies.redux).not.toBeTruthy()
        expect(noOptions.devDependencies['react-redux']).not.toBeTruthy()
        expect(noOptions.devDependencies['react-router-dom']).not.toBeTruthy()
      })

      it('should export `serverDependencies` as an empty object', () => {
        expect(noOptions.serverDependencies).toEqual({})
      })
    })

    describe('redux', () => {
      it('should include the `redux` package in `devDependencies`', () => {
        expect(redux.devDependencies.redux).toBeTruthy()
      })

      it('should include the `react-redux` package in `devDependencies`', () => {
        expect(redux.devDependencies['react-redux']).toBeTruthy()
      })

      it('should not include `react-router-dom` in `devDependencies`', () => {
        expect(redux.devDependencies['react-router-dom']).not.toBeTruthy()
      })
    })

    describe('router', () => {
      it('should include `react-router-dom` in `devDependencies`', () => {
        expect(router.devDependencies['react-router-dom']).toBeTruthy()
      })

      it('should not include `redux` in `devDependencies`', () => {
        expect(router.devDependencies.redux).not.toBeTruthy()
      })

      it('should not include `react-redux` in `devDependencies`', () => {
        expect(router.devDependencies['react-redux']).not.toBeTruthy()
      })
    })

    describe('redux & router', () => {
      it('should include the `redux` package in `devDependencies`', () => {
        expect(reduxRouter.devDependencies.redux).toBeTruthy()
      })

      it('should include the `react-redux` package in `devDependencies`', () => {
        expect(reduxRouter.devDependencies['react-redux']).toBeTruthy()
      })

      it('should include the `react-router-dom` package in `devDependencies`', () => {
        expect(reduxRouter.devDependencies['react-router-dom']).toBeTruthy()
      })
    })
  })

  describe('server combos', () => {
    describe('non-mongo options', () => {
      it('should not export any mongo-related packages in `serverDependencies`', () => {
        nonMongoServerCombos.forEach(({ serverDependencies }) => {
          expect(serverDependencies.hasOwnProperty('mongodb')).toBe(false)
          expect(serverDependencies.hasOwnProperty('connect-mongo')).toBe(false)
          expect(serverDependencies.hasOwnProperty('express-session')).toBe(false)
        })
      })

      it('should export the correct `serverDependencies`', () => {
        nonMongoServerCombos.forEach(({ serverDependencies }) => {
          expect(serverDependencies).toEqual(plainServerDeps)
        })
      })

      describe('server', () => {
        it('should export the same `devDepencies` as "no options" (minus dotenv)', () => {
          const { dotenv, ...deps } = noOptions.devDependencies
          expect(server.devDependencies).toEqual(deps)
        })
      })

      describe('serverRedux', () => {
        it('should export the same `devDepencies` as "redux" (minus dotenv)', () => {
          const { dotenv, ...deps } = redux.devDependencies
          expect(serverRedux.devDependencies).toEqual(deps)
        })
      })

      describe('serverRouter', () => {
        it('should export the same `devDepencies` as "router" (minus dotenv)', () => {
          const { dotenv, ...deps } = router.devDependencies
          expect(serverRouter.devDependencies).toEqual(deps)
        })
      })

      describe('serverReduxRouter', () => {
        it('should export the same `devDepencies` as "redux & router" (minus dotenv)', () => {
          const { dotenv, ...deps } = reduxRouter.devDependencies
          expect(serverReduxRouter.devDependencies).toEqual(deps)
        })
      })
    })

    describe('mongo-options', () => {
      it('should export all mongo-related packages in `serverDependencies`', () => {
        mongoServerCombos.forEach(({ serverDependencies }) => {
          expect(serverDependencies.hasOwnProperty('mongodb')).toBe(true)
          expect(serverDependencies.hasOwnProperty('connect-mongo')).toBe(true)
          expect(serverDependencies.hasOwnProperty('express-session')).toBe(true)

          expect(serverDependencies.mongodb).toBe(plainMongoDeps.mongodb)
          expect(serverDependencies['connect-mongo']).toBe(plainMongoDeps['connect-mongo'])
          expect(serverDependencies['express-session']).toBe(plainMongoDeps['express-session'])
        })
      })

      it('should export the correct `serverDependencies`', () => {
        const allMongoServerDeps = { ...plainServerDeps, ...plainMongoDeps }

        mongoServerCombos.forEach(({ serverDependencies }) => {
          expect(serverDependencies).toEqual(allMongoServerDeps)
        })
      })

      describe('mongo', () => {
        it('should export the same `devDepencies` as "no options" (minus dotenv)', () => {
          const { dotenv, ...deps } = noOptions.devDependencies
          expect(mongo.devDependencies).toEqual(deps)
        })
      })

      describe('mongoRedux', () => {
        it('should export the same `devDepencies` as "redux" (minus dotenv)', () => {
          const { dotenv, ...deps } = redux.devDependencies
          expect(mongoRedux.devDependencies).toEqual(deps)
        })
      })

      describe('mongoRouter', () => {
        it('should export the same `devDepencies` as "router" (minus dotenv)', () => {
          const { dotenv, ...deps } = router.devDependencies
          expect(mongoRouter.devDependencies).toEqual(deps)
        })
      })

      describe('mongoReduxRouter', () => {
        it('should export the same `devDepencies` as "redux & router" (minus dotenv)', () => {
          const { dotenv, ...deps } = reduxRouter.devDependencies
          expect(mongoReduxRouter.devDependencies).toEqual(deps)
        })
      })
    })
  })
})
