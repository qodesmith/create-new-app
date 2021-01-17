const chalk = require('chalk')
const {errorToObject} = require('./api/utilities/errorUtil')
const lines = '-'.repeat(45)

// 'unhandledRejection' => promise rejection
process.on('unhandledRejection', err => {
  const date = chalk.cyan(Date.now())
  const msg = chalk.red.bold(`Unhandled promise rejection at ${date}:\n`)

  console.log(`\n${lines}`)
  console.error(msg)
  console.error(errorToObject(err))
  console.log(`${lines}\n`)
})

// 'uncaughtException' => application error
process.on('uncaughtException', err => {
  const date = chalk.cyan(Date.now())
  const msg = chalk.red.bold(`\nUncaught exception at ${date}:\n`)

  console.log(`\n${lines}`)
  console.error(msg)
  console.error(errorToObject(err))
  process.exit(1)
})

/*
  Please DO NOT INCLUDE the `.env` file in version control.
  It is in the `.gitignore` file. Keep it that way.
  It contains your sensitive data! Instead, when deploying to production,
  you should manually copy the `.env` file to your hosting provider.
*/
require('dotenv').config({path: `${__dirname}/.env`}) // http://bit.ly/2WE8EJP

const {API, API_PORT, DEV_SERVER_PORT, NODE_ENV} = process.env // Environment variables.
const isProd = NODE_ENV === 'production'
const path = require('path')
const express = require('express')
const helmet = require('helmet') // Sets various http headers - http://bit.ly/2WylCJl
const compression = require('compression') // Gzip! - http://bit.ly/2WylU2T
const bp = require('body-parser') // Makes `req.body` available - http://bit.ly/2WE4r8X
const app = express()

/*
  Express middleware.
  Express security best practices - http://bit.ly/2KkcS2V
*/
app.use(
  express.static(
    // http://bit.ly/2Ko43Vy
    path.resolve(__dirname, 'dist'),
    // `no-cache` still caches but it checks with the server via etag to ensure the latest version.
    {setHeaders: res => res.set('Cache-Control', 'no-cache')}, // Cache static assets :)
  ),
  helmet(), // Headers security.
  compression(), // GZIP
  bp.json(), // http://bit.ly/2KpI7cL, http://bit.ly/2KkcVvD, http://bit.ly/2KmDSP3
  bp.urlencoded({extended: false}), // http://bit.ly/2KpI7cL, http://bit.ly/2Ko4f7e
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
  if (!isProd) {
    // This is simply to provide haptic feedback during development.
    console.log('Node server listening...')
  }
})
