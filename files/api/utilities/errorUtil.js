/*
  Calling `JSON.stringify(error)` will result in '{}' if there is no
  `Error.prototype.toJSON` (https://goo.gl/wsc2Jr). In order to
  mitigate that, this helper function takes advantage of the 2nd argument
  to `JSON.stringify` (https://goo.gl/XNHK2U) It ensures that we get back
  a properly stringified object with keys & values.

  Before:
    JSON.stringify(error) => '{}'

  After:
    stringifyError(error) => '{ "stack": ..., "message": ..., "etc": ... }'
*/

const replacer = (k, value) => {
  if (!(value instanceof Error)) return value

  return Object
    .getOwnPropertyNames(value)
    .reduce((acc, key) => ({ ...acc, [key]: value[key] }), {})
}

const stringifyError = (err, spacing = 0) => JSON.stringify(err, replacer, spacing)

const errorToObject = err => JSON.parse(stringifyError(err))

module.exports = {
  stringifyError,
  errorToObject
}
