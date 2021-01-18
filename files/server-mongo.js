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

const {
  APP_NAME,
  SECRET,
  API_PORT,
  API,
  DEV_SERVER_PORT,
  MONGO_SESSION_COLLECTION,
  NODE_ENV,
} = process.env // Environment variables.
const isProd = NODE_ENV === 'production'
const path = require('path')
const express = require('express')
const helmet = require('helmet') // Sets various http headers - http://bit.ly/2WylCJl
const compression = require('compression') // Gzip! - http://bit.ly/2WylU2T
const bp = require('body-parser') // Makes `req.body` available - http://bit.ly/2WE4r8X
const session = require('express-session') // Save data across requests - http://bit.ly/2Kmc5OV
const app = express()
const mongo = require('./api/utilities/mongo')

// MongoDB
const {sessionStoreErr} = require('./api/utilities/handleErrors')
const MongoStore = require('connect-mongo')(session)
const store = new MongoStore({
  dbName: APP_NAME,
  collection: MONGO_SESSION_COLLECTION,
  clientPromise: mongo(true), // `true` flag to retrieve ONLY the client.
})

// Catch & record store errors in the database.
store.on('error', sessionStoreErr)

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
  session({
    store,
    name: APP_NAME, // Needed if multiple apps running on same host.
    resave: false, // Forces cookie to be resaved back to the session store even if no changes.
    saveUninitialized: true, // Forces a session that is uninitialized to be saved to the store.
    secret: SECRET, // The secret used to sign the session ID cookie.
    cookie: {
      maxAge: null, // Default = `null` - closing browser removes cookie & session.
      httpOnly: true, // Default = `true` - on the client, `document.cookie` will not be available.
    },
  }),
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
    console.log(
      `💻  => PRODUCTION: Application running on port ${API_PORT}\n\n`,
    )
  } else {
    console.log(
      `💻  => Application running in browser at http://localhost:${DEV_SERVER_PORT}\n\n`,
    )
  }
})
