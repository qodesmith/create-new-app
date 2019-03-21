/*
  The purpose of this module is to allow the use of async / await
  when connecting to MongoDB throughout the app. An example:

  async function example() {
    const [dbErr, client, db] = await mongo()
    const postsCollection = await db.collection('posts')

    ...

    client.close()
  }
*/

const { MongoClient } = require('mongodb')
const logMongoAuthWarning = require('./logMongoAuthWarning')
const {
  MONGO_URI,
  MONGO_URI_PROD,
  APP_NAME,
  MONGO_USER,
  MONGO_USER_PASSWORD,
  MONGO_AUTH_SOURCE,
  NODE_ENV
} = process.env
const isProd = NODE_ENV === 'production'
const url = isProd ? MONGO_URI_PROD : MONGO_URI
const options = { useNewUrlParser: true }

if (isProd) {
  if (MONGO_USER && MONGO_USER_PASSWORD) {
    // Set the authentication credentials for the database.
    options.auth = { user: MONGO_USER, password: MONGO_USER_PASSWORD }
    options.authSource = MONGO_AUTH_SOURCE
  } else {
    // If no credentials found,
    // log out some warnings and instructions on how to create them.
    logMongoAuthWarning({ MONGO_USER, MONGO_USER_PASSWORD })
  }
}

/*
  We default to connecting to a database named after the `APP_NAME`.
  Users are still free to pass in their own custom name.
  To set the db name globally, replace `APP_NAME` below with a string.
*/
const mongo = (databaseName = APP_NAME) => (
  MongoClient.connect(url, options)
    .then(client => [null, client, client.db(databaseName)])
    .catch(err => [err])
)

module.exports = mongo
