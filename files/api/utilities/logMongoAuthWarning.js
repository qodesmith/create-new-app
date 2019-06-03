const chalk = require('chalk')

function logMongoAuthWarning({ MONGO_USER, MONGO_USER_PASSWORD }) {
  const dashes = '='.repeat(54)
  const warning = [
    '',
    !(MONGO_USER && MONGO_USER_PASSWORD)
      ? chalk.red('No Mongo credentials found.')
      : !MONGO_USER
      ? chalk.red('No `MONGO_USER` value found.')
      : chalk.red('No `MONGO_USER_PASSWORD` value found'),
    chalk.bold.red('YOUR DATABASE WILL ALLOW UN-AUTHENTICATED CONNECTIONS!'),
    '',
    'Add a single user in the `admin` database and then',
    `ensure \`${chalk.bold('MONGO_USER')}\` and \`${chalk.bold('MONGO_USER_PASSWORD')}\` are added`,
    'to your environment variables.',
    '',
    ''
  ].join('\n')

  console.warn(dashes) // START LOGGING.
  console.warn(warning)

  ;[
    chalk.bold('// Use the `admin` database.'),
    chalk.cyan('use admin'),
    '',
    chalk.bold('// Create a user with the appropriate roles.'),
    `${chalk.blue('const')} ${chalk.cyan('user')} = {`,
    `  ${chalk.cyan('user:')} ${chalk.yellow(`'myUserName'`)}, ${chalk.gray('// Make sure to change this!')}`,
    `  ${chalk.cyan('pw:')} ${chalk.yellow(`'myPassword'`)}, ${chalk.gray('// Make sure to change this!')}`,
    `  ${chalk.cyan('roles:')} [`,
    `    { ${chalk.cyan('role:')} ${chalk.yellow(`'userAdminAnyDatabase'`)}, ${chalk.cyan('db:')} ${chalk.yellow(`'admin'`)} },`,
    `    ${chalk.yellow(`'readWriteAnyDatabase'`)}`,
    '  ]',
    '}',
    '',
    `${chalk.bold('// Save that user to the `admin` database.')}`,
    `${chalk.cyan('db')}.${chalk.yellow('createUser')}(${chalk.cyan('user')})`
  ].forEach(line => console.log(line))

  console.log(`\n\nSee ${chalk.bold.blue('http://bit.ly/2UTn484')} for more details.`)
  console.log('')
  console.log(dashes) // FINISH LOGGING.
}

module.exports = logMongoAuthWarning
