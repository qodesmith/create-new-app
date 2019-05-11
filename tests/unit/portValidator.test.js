const portValidator = require('../../modules/portValidator')
const chalk = require('chalk')


describe('portValidator', () => {
  const originalConsoleLog = console.log
  console.log = jest.fn()

  beforeEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsoleLog)

  it(`should return the provided number when it's within range (1 - 65535)`, () => {
    expect(portValidator(1, 3000)).toBe(1)
    expect(portValidator(65535, 3000)).toBe(65535)
    expect(portValidator(7500, 3000)).toBe(7500)
  })

  it('should return a default number when number provided is out of range (1 - 65535)', () => {
    expect(portValidator(0, 3000)).toBe(3000)
    expect(portValidator(65536, 3000)).toBe(3000)
  })

  it('should log a yellow bold warning if the number provided is out of range (1 - 65535)', () => {
    const warning1 = `\n"0" is out of range (1 - 65535). Defaulting to 1234...\n`
    portValidator(0, 1234)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(chalk.yellow.bold(warning1))

    const warning2 = `\n"65536" is out of range (1 - 65535). Defaulting to 4321...\n`
    console.log.mockClear()
    portValidator(65536, 4321)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(chalk.yellow.bold(warning2))
  })

  it('should log a yellow bold warning if no number / non-number is provided', () => {
    const warning1 = chalk.yellow.bold(`\n"undefined" is an invalid port. Defaulting to 3000...\n`)
    portValidator(undefined, 3000)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(warning1)

    const warning2 = chalk.yellow.bold(`\n"nope" is an invalid port. Defaulting to 3000...\n`)
    console.log.mockClear()
    portValidator('nope', 3000)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(warning2)
  })
})
