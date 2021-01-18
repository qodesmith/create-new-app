/*
  This module will create CONTENTS for the `.env` file.
  If the user used the --force option, this module will prepend the existing contents.
*/

const fs = require('fs-extra')
const createBorderedCenteredComment = require('../modules/createBorderedCenteredComment')

// http://bit.ly/2Xmuwqf - micro UUID!
const uuid = a =>
  a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid)

// Filters out values that are null or undefined, sorts the keys.
function objToDotEnvVars(comments, obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      const value = obj[key]
      return value == null ? acc : `${acc}${key}=${value}\n`
    }, comments)
}

function dotEnv({options, destinationPath}) {
  const {
    appName,
    devServerPort,
    api,
    apiPort,
    mongo,
    mongoPort,
    mongoPortProd,
    mongoUser,
    mongoAuthSource,
    server,
  } = options

  // Read the files contents - in the case it already existed, we'll append new contents to it.
  let currentContents = ''
  try {
    currentContents = fs.readFileSync(destinationPath, 'utf8')
  } catch (e) {}

  // Create the leading content of the file.
  const previousContents = !currentContents
    ? ''
    : [
        currentContents,
        '\n',
        '###########################################################################',
        '########## THE CONTENT BELOW HAS BEEN APPENDED BY CREATE-NEW-APP ##########',
        '###########################################################################',
        '\n\n',
      ].join('\n')

  const mongoWarning = [
    '\n# A few things to note about MongoDB:',
    '#   * Your database port number (default 27017) should be different in production.',
    '#   * It is recommended that you set up authentication.',
    '#   * Type `cna --mongoHelp` for instructions on setting up authentication.',
    `#   * If you set up auth, you'll need to set MONGO_USER_PASSWORD to your password.`,
    '\n\n\n',
  ].join('\n')

  const warning = [
    '##########################################################',
    '#           THIS FILE WILL BE GIT IGNORED.               #',
    '#     DO NOT COMMIT THIS FILE INTO VERSION CONTROL!      #',
    '# PLEASE KEEP ANY SENSITIVE DATA OUT OF VERSION CONTROL. #',
    '##########################################################',
    '\n',
    '### Production Notes ###',
    '',
    '# When deploying your app to production, you should copy this file',
    '# over to your remote machine. Make sure all values are correct & up to date.',
    mongo ? mongoWarning : '\n\n\n',
  ].join('\n')

  const contents = {
    APP_NAME: appName,
    DEV_SERVER_PORT: devServerPort,
    API_WEBPACK: api || null,
  }

  const serverContents = {
    API: api === '/' ? '' : api ? api : '/api', // Value consumed in `server.js`.
    API_WEBPACK: api || '/api', // Value consumed in `webpack.config.js`.
    API_PORT: apiPort,
  }

  const mongoContents = {
    MONGO_URI: `mongodb://localhost:${mongoPort}/${appName}`,
    MONGO_URI_PROD: `mongodb://localhost:${mongoPortProd}/${appName}`,
    MONGO_USER: `${mongoUser}`,
    MONGO_USER_PASSWORD: '',
    MONGO_AUTH_SOURCE: `${mongoAuthSource}`, // http://bit.ly/2XkUWZn
    MONGO_SESSION_COLLECTION: `${appName}Sessions`,
    SECRET: `${uuid()}`,
  }

  const newDotEnvContents = (() => {
    if (mongo) {
      return objToDotEnvVars(warning, {
        ...contents,
        ...serverContents,
        ...mongoContents,
      })
    } else if (server) {
      return objToDotEnvVars(warning, {...contents, ...serverContents})
    } else {
      return objToDotEnvVars(warning, contents)
    }
  })()

  return `${previousContents}${newDotEnvContents}`
}

module.exports = dotEnv
