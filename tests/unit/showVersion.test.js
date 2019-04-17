const showVersion = require('../../modules/showVersion')


describe('showVersion', () => {
  const originalConsoleLog = console.log

  beforeEach(() => console.log = jest.fn())

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('should log the librarys version to the console', () => {
    showVersion()
    expect(console.log).toHaveBeenCalled()
  })
})
