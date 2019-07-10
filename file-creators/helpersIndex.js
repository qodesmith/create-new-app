const fs = require('fs-extra')
const path = require('path')

function helpersIndex({ redux }) {
  const filePath = path.resolve(__dirname, '../files')
  const commonHelpers = fs.readFileSync(`${filePath}/helpers/commonHelpers.js`)
  const reduxHelpers = fs.readFileSync(`${filePath}/helpers/reduxHelpers.js`)

  return `${commonHelpers}${redux ? `\n${reduxHelpers}` : ''}`
}

module.exports = helpersIndex
