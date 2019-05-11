// This module logs the cna version when running `cna --version`.

function showVersion() {
  const json = require('../package.json')
  console.log(json.version)
}

module.exports = showVersion
