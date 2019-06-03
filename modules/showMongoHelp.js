/*
  This module logs MongoDB-specific help to the screen
  when running `cna --mongoHelp`.
*/

const chalk = require('chalk')
const indentFromZero = require('./indentFromZero')
const indentToNum = require('./indentToNum')
const makeTable = require('./makeTable')
const colors = [chalk.cyan, chalk.yellow]
const tableRows = [
  ['MONGO_URI', 'mongodb://localhost:<mongoPort>/<appName>'],
  ['MONGO_URI_PROD', 'mongodb://localhost:<mongoPortProd>/<appName>'],
  ['MONGO_USER', '<mongoUser>'],
  ['MONGO_USER_PASSWORD', '<fill this value manually>'],
  ['MONGO_AUTH_SOURCE', '<mongoAuthSource>'],
  ['MONGO_SESSION_COLLECTION', '<appName>Sessions']
]


function showMongoHelp() {
  console.log(indentFromZero(`
    When deploying apps using MongoDB in production,
    you'll want to ensure 2 main things:

      1. You use a different port than the default port (27017).
      2. You use authentication with a username and password to connect.


    Wherever you are running MongoDB in production you'll want to
    create a new user in the \`admin\` database. SSH into your machine
    and you can add a user from the Mongo console like so:

        ${chalk.bold('// Use the `admin` database.')}
        ${chalk.cyan('use admin')}

        ${chalk.bold('// Create a user with the appropriate roles.')}
        ${chalk.blue('const')} ${chalk.cyan('user')} = {
          ${chalk.cyan('user:')} ${chalk.yellow(`'myUserName'`)}, ${chalk.gray('// Make sure to change this!')}
          ${chalk.cyan('pw:')} ${chalk.yellow(`'myPassword'`)}, ${chalk.gray('// Make sure to change this!')}
          ${chalk.cyan('roles:')} [
            { ${chalk.cyan('role:')} ${chalk.yellow(`'userAdminAnyDatabase'`)}, ${chalk.cyan('db:')} ${chalk.yellow(`'admin'`)} },
            ${chalk.yellow(`'readWriteAnyDatabase'`)}
          ]
        }

        ${chalk.bold('// Save that user to the `admin` database.')}
        ${chalk.cyan('db')}.${chalk.yellow('createUser')}(${chalk.cyan('user')})

    See ${chalk.blue('http://bit.ly/2UTn484')} for more details.


    Mongo-specific variables will be setup in the \`.env\` file.
    If you used the guided process, these variables will contain the
    ${chalk.bold('default values')} and ${chalk.bold('should be changed')} before deploying to production.
    You will have to manually set the value to \`MONGO_USER_PASSWORD\`.

    If you passed all your options to the cli, these will be filled:
        ${indentToNum(makeTable(tableRows, { colors, rounded: true }), 8)}

    When you're ready to deploy your app, make sure the above variables
    have the appropriate values. Then copy the \`.env\` file over to your
    remote server. ${chalk.bold('It is git-ignored and will not be in version control')}.
  `))
}

// http://bit.ly/2Z6SeXV
// Remove ANSI color characters (this is a bold cyan "hello"):
// '\u001b[1m\u001b[36mhello\u001b[39m\u001b[22m'.replace(/\u001b\[.*?m/g, '')

module.exports = showMongoHelp
