/*
  The purpose of this module is to allow the use of async / await
  when connecting to MongoDB throughout the app. An example:

  async function example() {
    const [dbErr, db] = await mongo()
    db.collection('posts')...
  }
*/

const catchify = require('catchify')
const MongoClient = require('mongodb').MongoClient
const { mongoURI } = process.env
const mongo = () => catchify(MongoClient.connect(mongoURI))

module.exports = mongo
