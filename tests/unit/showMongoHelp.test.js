/*
  https://goo.gl/SoTnCf
  Remove ANSI color characters (this is a bold cyan "hello"):
  '\u001b[1m\u001b[36mhello\u001b[39m\u001b[22m'.replace(/\u001b\[.*?m/g, '')
*/

const showMongoHelp = require('../../modules/showMongoHelp')


describe('showMongoHelp', () => {
  const originalConsoleLog = console.log

  beforeEach(() => console.log = jest.fn())

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('should log mongo-specific help to the screen', () => {
    showMongoHelp()
    expect(console.log).toHaveBeenCalled()
  })

  it('should show an example of how to add a user in the Mongo console', () => {
    showMongoHelp()
    const logContents = console.log.mock.calls[0][0].replace(/\u001b\[.*?m/g, '')

    ;[
      '// Use the `admin` database.',
      'use admin',
      '// Create a user with the appropriate roles.',
      'const user = {',
      `  user: 'myUserName', // Make sure to change this!`,
      `  pw: 'myPassword', // Make sure to change this!`,
      '  roles: [',
      `    { role: 'userAdminAnyDatabase', db: 'admin' },`,
      `    'readWriteAnyDatabase'`,
      '  ]',
      '}',
      '// Save that user to the `admin` database.',
      'db.createUser(user)'
    ].forEach((line, i) => expect(logContents.includes(line)).toBe(true))
  })

  it('should show and explanation of all the .env mongo variables', () => {
    showMongoHelp()
    const logContents = console.log.mock.calls[0][0]

    ;[
      ['MONGO_URI', 'mongodb://localhost:<mongoPort>/<appName>'],
      ['MONGO_URI_PROD', 'mongodb://localhost:<mongoPortProd>/<appName>'],
      ['MONGO_USER', '<mongoUser>'],
      ['MONGO_USER_PASSWORD', '<fill this value manually>'],
      ['MONGO_AUTH_SOURCE', '<mongoAuthSource>'],
      ['MONGO_SESSION_COLLECTION', '<appName>Sessions']
    ].forEach(line => {
      line.forEach(item => expect(logContents.includes(item)).toBe(true))
    })
  })
})
