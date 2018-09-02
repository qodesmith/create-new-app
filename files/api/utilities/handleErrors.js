const mongo = require('./mongo')
const isProd = process.env.NODE_ENV === 'production'

/*
  toLocaleString - https://goo.gl/obzAhL
  Returns a date string local to NY - '9/14/2017, 2:36:31 PM'
  https://goo.gl/SkVvba
*/
const localDate = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

/*
  This function is used to create error objects that will be stored in MongoDB.
  The idea is that there will be an admin-only section on the front end
  that will display this error data in a meaningful way.
*/
const createError = (type = 'unknown', { message, stack } = {}) => ({
  type,
  stack,
  error: message,
  localDate: localDate(),
  date: Date.now()
})

// A helper function that saves errors to the database.
async function saveErrorToDb(err) {
  if (!isProd) return console.log('ERROR CREATED FOR DB:', err)

  const [dbErr, client, db] = await mongo()
  if (dbErr) return
  await db.collection('errors').insertOne(err)
  client.close()
}

// Inserts, saves, etc. error's are handled with this function.
function operationErr(err, operation, collection, req) {
  const error = createError('db operation', err)
  const newError = {
    operation,
    collection,
    url: req.originalUrl,
    ...error
  }

  saveErrorToDb(newError)
}

// Errors happening from the session store which uses MongoDB.
function sessionStoreErr(err) {
  const error = createError('session store', err)
  saveErrorToDb(error)
}

// When Mongo can't connect.
function noConnect(res, err) {
  const error = createError('no connect', err)
  res.status(500).send({ error })
}

module.exports = {
  operationErr,
  sessionStoreErr,
  noConnect
}
