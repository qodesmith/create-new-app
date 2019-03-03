/*
  Inspired by this article - https://goo.gl/9KnMYT
  Catchify is also a great library for this - https://github.com/majgis/catchify
*/

const catchy = value => (
  Promise.resolve(value)
    .then(res => [null, res])
    .catch(err => [err])
)

module.exports = catchy
