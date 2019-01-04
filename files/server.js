/*
  Please be sure to EXCLUDE the `.env` file from version control.
  In production, whatever host you use to deploy your server will
  give you options to set environment config variables. Be sure to
  set the variables found in `.env` accordingly.
  Also for production, don't forget to change the start script in
  `package.json` to only start the API server in production mode!
*/
const notProd = process.env.NODE_ENV !== 'production'
if (notProd) {
  require('dotenv').load() // https://goo.gl/Cj8nKu
}

const { appName, API_PORT, DEV_SERVER_PORT } = process.env // Environment variables.
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
// app.get('/my-endpoint', require('./api/my-endpoint'))


/*
  Catch-all endpoint which delivers `index.html` and let's
  the front-end handle all the routing including 404's.
  This should be the last chronological GET route.
*/
app.get('*', require('./api/home'))

// And so it begins...
app.listen(API_PORT, () => {
  notProd && console.log(`💻  => Application running in browser at http://localhost:${DEV_SERVER_PORT}\n\n`)
})
