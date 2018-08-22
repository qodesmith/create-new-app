/*
  Inspired by this article - https://goo.gl/9KnMYT
  Catchify is also a great library for this - https://github.com/majgis/catchify
*/

const catchy = thing => {
  const isPromise = ({}).toString.call(thing) === '[object Promise]'

  return new Promise((resolve, reject) => {
    if (isPromise) return thing.then(resolve).catch(reject)
    return resolve(thing)
  })
    .then(res => [null, res])
    .catch(err => [err])
}

module.exports = catchy
