/*
  This file is meant to manually test a created MongoDB app.
  The contents
*/

const mongo = require('utilities/mongo')
const https = require('https')

/*
  https://nodejs.org/api/http.html#http_http_get_options_callback
  The usage of the https module was taken straight from the docs.
  The example was given for http, but its the same thing.
*/
function fetchPosts() {
  https.get('https://my.api.mockaroo.com/blog?key=6b207f50', res => {
    let rawData = ''
    const { statusCode } = res

    if (statusCode !== 200) return console.log('FAILED ATTEMPT!', statusCode)

    res.setEncoding('utf8')
    res.on('data', chunk => { rawData += chunk })
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData)
        seedDb(parsedData)
      } catch (e) {
        console.error(e.message)
      }
    })
  }).on('error', e => {
    console.log('ERROR HAPPENED:', console.log(e.message))
  })
}

async function seedDb(posts) {
  const [err, client, db] = await mongo()
  if (err) return console.log(err)

  await db.collection('posts').insertMany(posts)
  client.close()
}