/*
  The purpose of this module is to allow the use of async / await
  when connecting to MongoDB throughout the app. An example:

  async function example() {
    const [dbErr, client, db] = await mongo()
    const postsCollection = await db.collection('posts')
  }
*/

const {MongoClient} = require('mongodb')
const logMongoAuthWarning = require('./logMongoAuthWarning')
const {
  MONGO_URI,
  MONGO_URI_PROD,
  APP_NAME,
  MONGO_USER,
  MONGO_USER_PASSWORD,
  MONGO_AUTH_SOURCE,
  NODE_ENV,
} = process.env
const isProd = NODE_ENV === 'production'
const url = isProd ? MONGO_URI_PROD : MONGO_URI
const data = {client: null, db: null}
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true, // http://bit.ly/2Zpn4PD
}

if (isProd) {
  if (MONGO_USER && MONGO_USER_PASSWORD) {
    // Set the authentication credentials for the database.
    options.auth = {user: MONGO_USER, password: MONGO_USER_PASSWORD}
    options.authSource = MONGO_AUTH_SOURCE
  } else {
    // If no credentials found,
    // log some warnings and instructions on how to create them.
    logMongoAuthWarning({MONGO_USER, MONGO_USER_PASSWORD})
  }
}

// `clientOnly` is only used when creating the MongoStore in `server.js`.
const mongo = clientOnly => {
  if (data.client) {
    return Promise.resolve(
      clientOnly ? data.client : [null, data.client, data.client.db(APP_NAME)],
    )
  }

  return MongoClient.connect(url, options)
    .then(client => {
      // Store references to the results to avoid future calls to MongoClient.
      data.client = client
      data.db = client.db(APP_NAME)

      // Return the appropriate results.
      return clientOnly ? client : [null, client, client.db(APP_NAME)]
    })
    .catch(err => [err])
}

module.exports = mongo
