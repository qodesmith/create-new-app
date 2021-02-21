// This module logs the cna version when running `cna --version`.

const getVersion = require('./getVersion')

function showVersion() {
  console.log(getVersion())
}

module.exports = showVersion
