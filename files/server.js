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
const app = express()

// Environment variables.
const { appName, API_PORT } = process.env

// Express middleware.
app.use(
  express.static(path.resolve(__dirname, 'dist')), // https://goo.gl/759KqP
  helmet(), // Headers security.
  compression(), // GZIP
  bp.json(), // http://goo.gl/ixEWAa, https://goo.gl/Xp2pBC, https://goo.gl/g9V9AM
  bp.urlencoded({ extended: false }) // http://goo.gl/ixEWAa, https://goo.gl/jkPwBu
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
