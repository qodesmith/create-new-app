const mongo = require('../utilities/mongo')

async function exampleGetEndpoint(req, res) {
  const [err, client, db] = await mongo()
  if (err) return console.log(err)

  // Get all blog posts from the `posts` collection in Mongo.
  const posts = await db.collection('posts').find({}).toArray()
  res.json(posts)
  client.close()
}
