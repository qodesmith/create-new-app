const safeToCreateDir = require('../../modules/safeToCreateDir')
const chalk = require('chalk')
const path = require('path')


describe('safeToCreateDir', () => {
  const originalConsoleLog = console.log
  console.log = jest.fn()

  beforeEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsoleLog)

  it('should return true if a given directory does not exist', () => {
    const appDir = path.resolve(__dirname, '../does-not-exist')

    expect(safeToCreateDir({ appDir })).toBe(true)
    expect(console.log).not.toHaveBeenCalled()
  })

  describe('when a directory exists', () => {
    it('should log a message and return undefined', () => {
      const results = safeToCreateDir({ appDir: __dirname, appName: 'test' })
      const msg1 = `The directory ${chalk.green('test')} already exists.`
      const msg2 = 'Try a different name.'

      expect(results).toBe(undefined)
      expect(console.log).toHaveBeenCalledTimes(2)
      expect(console.log).toHaveBeenCalledWith(msg1)
      expect(console.log).toHaveBeenCalledWith(msg2)
    })

    it('should log a message (only once) if using the `force` option and return true', () => {
      const results1 = safeToCreateDir({ appDir: __dirname, force: true, appName: 'abc' })
      const results2 = safeToCreateDir({ appDir: __dirname, force: true, appName: '123' })
      const msg = `Force installing in pre-existing directory ${chalk.green('abc')}...`

      expect(results1).toBe(true)
      expect(results2).toBe(true)
      expect(console.log).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith(msg)
    })
  })
})
