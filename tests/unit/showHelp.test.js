const showHelp = require('../../modules/showHelp')


describe('showHelp', () => {
  const originalConsoleLog = console.log
  console.log = jest.fn()

  beforeEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsoleLog)

  it('should log help to the screen, containing all the correct info', () => {
    showHelp()
    const output = console.log.mock.calls[0][0]

    expect(console.log).toHaveBeenCalledTimes(1)
    expect(output).toMatchSnapshot()
  })
})
