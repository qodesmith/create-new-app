/*
  Express production best practices:
  ----------------------------------

  security - http://goo.gl/LBmJXK
*/

require('dotenv').load() // https://goo.gl/Cj8nKu
const path = require('path')
const express = require('express')
const helmet = require('helmet') // Sets various http headers - https://goo.gl/g7K98x
const compression = require('compression') // Gzip! - https://goo.gl/ShNShk
const bp = require('body-parser') // Makes `req.body` available - https://goo.gl/0UviQN
const session = require('express-session') // Save data across requests - https://goo.gl/GEFgyQ
const app = express()

// Environment variables.
const { mongoURI, mongoSession, appName, secret, API_PORT } = process.env

// MongoDB
const { sessionStoreErr } = require('./api/utilities/handleErrors')
const MongoStore  = require('connect-mongodb-session')(require('express-session'))
const store = new MongoStore({
  uri: mongoURI,
  collection: mongoSession
})

// Catch & record store errors in the database.
store.on('error', sessionStoreErr)

// Express middleware.
app.use(
  express.static(path.resolve(__dirname, 'dist')), // https://goo.gl/759KqP
  helmet(), // Headers security.
  compression(), // GZIP
  bp.json(), // http://goo.gl/ixEWAa, https://goo.gl/Xp2pBC, https://goo.gl/g9V9AM
  bp.urlencoded({ extended: false }), // http://goo.gl/ixEWAa, https://goo.gl/jkPwBu
  session({
    store,
    name: appName, // Needed if multiple apps running on same host.
    resave: false, // Forces cookie to be resaved back to the session store even if no changes.
    saveUninitialized: true, // Forces a session that is uninitialized to be saved to the store.
    secret, // The secret used to sign the session ID cookie.
    cookie: {
      maxAge: null, // Default = `null` - closing browser removes cookie & session.
      httpOnly: true // Default = `true` - on the client, `document.cookie` will not be available.
    }
  })
)

/*
  ADD YOUR CUSTOM ENDPOINTS HERE
  ------------------------------
*/


/*
  Catch-all endpoint which delivers `index.html` and let's
  the front-end handle all the routing including 404's.
  This should be the last chronological GET route.
*/
app.get('*', require('./api/home'))

// And so it begins...
app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}...`))
