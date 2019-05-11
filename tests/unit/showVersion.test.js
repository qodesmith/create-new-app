const showVersion = require('../../modules/showVersion')
const fs = require('fs-extra')
const path = require('path')


describe('showVersion', () => {
  const originalConsoleLog = console.log
  console.log = jest.fn()

  beforeEach(() => console.log.mockReset())
  afterAll(() => console.log = originalConsoleLog)

  it(`should log the CNA's version to the console`, () => {
    const pkgJsonPath = path.resolve(__dirname, '../../')
    const { version } = fs.readJSONSync(`${pkgJsonPath}/package.json`)

    showVersion()
    expect(console.log).toHaveBeenCalledWith(version)
  })
})
