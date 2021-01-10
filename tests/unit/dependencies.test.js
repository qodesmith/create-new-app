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
