function getVersion() {
  const json = require('../package.json')
  return json.version
}

module.exports = getVersion
