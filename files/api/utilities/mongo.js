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
const mongo = () => (
  MongoClient.connect(mongoURI)
    .then(client => [null, client, client.db(appName)])
    .catch(err => [err])
)

module.exports = mongo
