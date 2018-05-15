function showVersion() {
  const json = require('../package.json')
  console.log(json.version)
}

module.exports = showVersion
