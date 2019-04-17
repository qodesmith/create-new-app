const showHelp = require('../../modules/showHelp')
const chalk = require('chalk')


describe('showHelp', () => {
  const originalConsoleLog = console.log

  beforeEach(() => console.log = jest.fn())

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('should log help to the screen', () => {
    showHelp()
    expect(console.log).toHaveBeenCalled()
  })

  it('should show how to use the tool', () => {
    showHelp()
    const msg = `Usage: ${chalk.bold('create-new-app')} ${chalk.green('<project-directory>')} [options]`
    const logContents = console.log.mock.calls[0][0]

    expect(logContents.includes(msg)).toBe(true)
  })

  it('should show all the correct sections of help', () => {
    showHelp()
    const logContents = console.log.mock.calls[0][0]

    ;[
      'General options:',
      'App options:',
      'package.json field options:',
      'API / server options:',
      'MongoDB options:',
      'Creating a sandbox project:',
      'Using MongoDB with your app?  View some tips for production with this:',
      `Have an issue?  Help keep ${chalk.bold('create-new-app')} awesome by reporting it here:`
    ].forEach(section => expect(logContents.includes(section)).toBe(true))

    expect(console.log).toHaveBeenCalledTimes(1)
  })

  it('should list all the options', () => {
    showHelp()
    const logContents = console.log.mock.calls[0][0]

    ;[
      // General options.
      '-v,  --version',
      '-h,  --help',
      '-mh, --mongoHelp',
      '-o,  --offline',
      '-t,  --title',
      '-f,  --force',

      // App options.
      '-x,  --redux',
      '-r,  --router',

      // package.json fields.
      '--author',
      '--description',
      '--email',
      '--keywords',

      // API / server options.
      '--api',
      '--apiport',
      '-e, --express',
      '-p, --port',

      // MongoDB options.
      '-m,    --mongo',
      '--mp,  --mongoPort',
      '--mpp, --mongoPortProd',
      '--mu,  --mongoUser',
      '--mup, --mongoUserPassword',
      '--mas, --mongoAuthSource',

      // Sandbox.
      '-s, --sandbox',

      // Bottom of message.
      'cna --mongoHelp',
      'https://github.com/qodesmith/create-new-app/issues/new'
    ].forEach(item => expect(logContents.includes(item)).toBe(true))

    expect(console.log).toHaveBeenCalledTimes(1)
  })
})
