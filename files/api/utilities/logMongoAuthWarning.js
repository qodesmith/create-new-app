const chalk = require('chalk')

function logMongoAuthWarning(skipWarning) {
  const lastSentence = 'add `mongoUser` and `mongoUserPassword` values to your environment variables.'
  const dashes = '-'.repeat(lastSentence.length)
  const warning = [
    dashes,
    '',
    'No Mongo credentials found.',
    '**************************************************************',
    '*                                                            *',
    `*   ${chalk.bold.yellow('YOUR DATABASE WILL ALLOW UN-AUTHENTICATED CONNECTIONS!')}   *`,
    '*                                                            *',
    '**************************************************************',
    '',
    'Add a single user in the `admin` database and then',
    lastSentence,
    '',
    ''
  ].join('\n')

  if (skipWarning) {
    console.log(lastSentence.slice(0, 1).toUpperCase() + lastSentence.slice(1))
  } else {
    console.warn(warning)
  }

  console.log('You can add a user to the `admin` database from the Mongo console like so:\n\n')
  console.log(`${chalk.bold.yellow('use admin')}\n`)
  console.log(chalk.bold.yellow('const user ='), chalk.bold.yellow(JSON.stringify({
    user: 'myUserAdmin',
    pw: 'abc123',
    roles: [
      { role: 'userAdminAnyDatabase', db: 'admin'},
      'readWriteAnyDatabase'
    ]
  }, null, 2)))
  console.log(`\n${chalk.bold.yellow('db.createUser(user)')}`)

  console.log(`\n\nSee ${chalk.bold.blue('https://goo.gl/T5Rpe6')} for more details.`)
  console.log('\n' + dashes)
}

module.exports = logMongoAuthWarning
