const badName = require('../../modules/badName')


describe('badName', () => {
  const originalConsole = console.log
  const naughtyName = 'nope! no way!'
  const validation = {
    errors: ['no bueno'],
    warnings: ['naughty naughty']
  }
  console.log = jest.fn()

  beforeEach(() => badName(naughtyName, validation))
  afterEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsole)

  it('should log a message with the failed app name, errors, & warnings', () => {
    expect(console.log).toHaveBeenCalledTimes(3)
    expect(console.log.mock.calls).toMatchSnapshot()
  })
})
