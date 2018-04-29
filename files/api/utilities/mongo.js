/*
  The purpose of this module is to allow the use of async / await
  when connecting to MongoDB throughout the app. An example:

  async function example() {
    const [dbErr, client, db] = await mongo()
    const postsCollection = db.collection('posts')

    ...

    client.close()
  }
*/

const { MongoClient } = require('mongodb')
const { mongoURI, appName } = process.env

/*
  We default to connecting to a database named after the `appName`.
  Users are still free to pass in their own custom name.
*/
const mongo = (database = appName) => (
  MongoClient.connect(mongoURI)
    .then(client => [null, client, client.db(database)])
    .catch(err => [err])
)

module.exports = mongo
