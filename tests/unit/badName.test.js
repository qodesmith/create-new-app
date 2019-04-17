const badName = require('../../modules/badName')
const mockConsole = require('jest-mock-console').default


describe('badName', () => {
  let restoreConsole
  let calls
  const naughtyName = 'nope! no way!'
  const validation = {
    errors: ['no bueno'],
    warnings: ['naughty naughty']
  }

  beforeEach(() => {
    restoreConsole = mockConsole(['log'])
    badName(naughtyName, validation)
    calls = console.log.mock.calls
  })

  afterEach(() => restoreConsole())

  it('should log a message with the failed app name.', () => {
    expect(console.log).toHaveBeenCalled()
    expect(calls.length).toBe(3)
    expect(calls[0][0].includes('Could not create a project called')).toBe(true)
    expect(calls[0][0].includes('because of npm naming restrictions:')).toBe(true)
    expect(calls[0][0].includes(naughtyName)).toBe(true)
  })

  it('should log errors & warnings to the console', () => {
    expect(console.log).toHaveBeenCalled()
    expect(calls[1][0].includes(`  *  ${validation.errors[0]}`)).toBe(true)
    expect(calls[2][0].includes(`  *  ${validation.warnings[0]}`)).toBe(true)
  })
})
