const fs = require('fs')
const path = require('path')

function webpackConfig(redux) {
  const placeholder = '@@__PLACEHOLDER_WEBPACK_ALIAS__@@'
  const filePath = path.resolve(__dirname, '../files/webpack.config.js')
  const config = fs.readFileSync(filePath, 'utf-8')
  const lines = config.split('\n')

  // Which line # has the placeholder string.
  const num = lines.findIndex(line => line.includes(placeholder))

  // The line contents.
  const line = lines[num]

  /*
    https://goo.gl/DirJ71
    Figure out how many empty spaces there are for the indentation.
    Our object properties should be indented 2 more than that.
  */
  const indent = ' '.repeat(line.search(/\S/) + 2)

  // Construct the appropriate webpack alias object for redux or not.
  const aliasObject = [
    '{',
    `${indent}components: path.resolve(__dirname, 'src/components')${redux ? ',' : ''}`,
    redux && `${indent}actions: path.resolve(__dirname, 'src/utils/actions'),`,
    redux && `${indent}helpers: path.resolve(__dirname, 'src/utils/helpers'),`,
    redux && `${indent}middleware: path.resolve(__dirname, 'src/utils/middleware'),`,
    redux && `${indent}reducers: path.resolve(__dirname, 'src/utils/reducers'),`,
    redux && `${indent}utils: path.resolve(__dirname, 'src/utils')`,
    `${indent.slice(2)}},` // Closing bracket indented 2 spaces closer.
  ].filter(Boolean).join('\n')

  return config.replace(placeholder, aliasObject)
}

module.exports = webpackConfig
