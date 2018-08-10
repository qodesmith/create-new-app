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
const { mongoURI, appName } = process.env

/*
  We default to connecting to a database named after the `appName`.
  Users are still free to pass in their own custom name.
  To set the db name globally, replace `appName` below with a string.
*/
const mongo = (databaseName = appName) => (
  MongoClient.connect(mongoURI, { useNewUrlParser: true })
    .then(client => [null, client, client.db(databaseName)])
    .catch(err => [err])
)

module.exports = mongo
