const chalk = require('chalk')
const { errorToObject } = require('./api/utilities/errorUtil')
const lines = '-'.repeat(45)

// 'unhandledRejection' => promise rejection
process.on('unhandledRejection', err => {
  const date = chalk.cyan(Date.now())
  const msg = chalk.red.bold(`Unhandled promise rejection at ${date}:\n`)

  console.log(`\n${lines}`)
  console.error(msg, errorToObject(err))
  console.log(`${lines}\n`)
})

// 'uncaughtException' => application error
process.on('uncaughtException', err => {
  const date = chalk.cyan(Date.now())
  const msg = chalk.red.bold(`\nUncaught exception at ${date}:\n`)

  console.log(`\n${lines}`)
  console.error(msg, errorToObject(err))
  process.exit(1)
})

/*
  Please DO NOT INCLUDE the `.env` file from version control.
  It is in the `.gitignore` file. Keep it that way.
  It contains your sensitive data! Instead, when deploying to production,
  you should manually copy the `.env` file to your hosting provider.
*/
require('dotenv').config() // https://goo.gl/Cj8nKu

const { API, API_PORT, DEV_SERVER_PORT, NODE_ENV } = process.env // Environment variables.
const isProd = NODE_ENV === 'production'
const path = require('path')
const express = require('express')
const helmet = require('helmet') // Sets various http headers - https://goo.gl/g7K98x
const compression = require('compression') // Gzip! - https://goo.gl/ShNShk
const bp = require('body-parser') // Makes `req.body` available - https://goo.gl/0UviQN
const app = express()

/*
  Express middleware.
  Express security best practices - http://goo.gl/LBmJXK
*/
app.use(
  express.static( // https://goo.gl/759KqP
    path.resolve(__dirname, 'dist'),
    // `no-cache` still caches but it checks with the server via etag to ensure the latest version.
    { setHeaders: res => res.set('Cache-Control', 'no-cache') } // Cache static assets :)
  ),
  helmet(), // Headers security.
  compression(), // GZIP
  bp.json(), // http://goo.gl/ixEWAa, https://goo.gl/Xp2pBC, https://goo.gl/g9V9AM
  bp.urlencoded({ extended: false }) // http://goo.gl/ixEWAa, https://goo.gl/jkPwBu
)

/*
  ADD YOUR CUSTOM ENDPOINTS HERE
  ------------------------------
*/
// app.get(`${API}/my-endpoint`, require('./api/my-endpoint'))


/*
  Catch-all endpoint which delivers `index.html` and let's
  the front-end handle all the routing including 404's.
  This should be the last chronological GET route.
*/
app.get('*', require('./api/home'))

// And so it begins...
app.listen(API_PORT, () => {
  if (isProd) {
    console.log(`💻  => PRODUCTION: Application running on port ${API_PORT}\n\n`)
  } else {
    console.log(`💻  => Application running in browser at http://localhost:${DEV_SERVER_PORT}\n\n`)
  }
})
