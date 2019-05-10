const showMongoHelp = require('../../modules/showMongoHelp')


describe('showMongoHelp', () => {
  const originalConsoleLog = console.log
  console.log = jest.fn()

  beforeEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsoleLog)

  it('should log mongo-specific help to the screen', () => {
    showMongoHelp()
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log.mock.calls).toMatchSnapshot()
  })
})
