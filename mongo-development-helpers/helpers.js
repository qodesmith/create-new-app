const mongo = require('./utilities/mongo')

function fetchPosts() {
  fetch('https://my.api.mockaroo.com/blog?key=6b207f50')
    .then(res => res.json())
    .then(posts => seedDb(posts))
}

function seedDb(posts) {
  const [err, db] = mongo()
  console.log(db.collection)
}