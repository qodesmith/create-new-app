/*
  EXAMPLE USE CASE
  ----------------

  Imagine getting blog posts...

  async function posts() {
    const [error, posts] = await catchy(getPostsFromDB())

    if (error) throw 'Error retrieving posts!'
    return posts
  }
*/

function catchy(promise) {
  return promise
    .then(res => [null, res])
    .catch(err => [err])
}

module.exports = catchy
