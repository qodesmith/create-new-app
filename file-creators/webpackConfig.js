const fs = require('fs')
const path = require('path')

function webpackConfig({ redux }) {
  const aliasPlaceholder = '@@__PLACEHOLDER_WEBPACK_ALIAS__@@'
  const filePath = path.resolve(__dirname, '../files/webpack.config.js')
  const config = fs.readFileSync(filePath, 'utf-8')
  const lines = config.split('\n')

  // Which line #'s' has the placeholders.
  const aliasLineNum = lines.findIndex(line => line.includes(aliasPlaceholder))

  // The line contents.
  const aliasLine = lines[aliasLineNum]

  /*
    https://goo.gl/DirJ71
    Figure out how many empty spaces there are for the indentation.
    Our object properties should be indented 2 more than that.
  */
  const indent = ' '.repeat(aliasLine.search(/\S/) + 2)

  // Construct the appropriate webpack alias object for redux or not.
  const aliasReduxObject = [
    `actions: path.resolve(__dirname, 'src/utils/actions'),`,
    `helpers: path.resolve(__dirname, 'src/utils/helpers'),`,
    `middleware: path.resolve(__dirname, 'src/utils/middleware'),`,
    `reducers: path.resolve(__dirname, 'src/utils/reducers'),`,
    `utils: path.resolve(__dirname, 'src/utils'),`,
    '/*',
    '  To replace React with (P)react, run: `npm i -D preact preact-compat`',
    '  Preact does not have <Fragment /> as part of its API yet:',
    '    https://github.com/developit/preact/issues/946',
    '*/',
    `// react: 'preact-compat',`,
    `// 'react-dom': 'preact-compat'`,
  ].map(line => `${indent}${line}`).join('\n')

  // Construct the final alias object, possible including `aliasReduxObject` from above.
  const aliasObject = [
    '{',
    `${indent}components: path.resolve(__dirname, 'src/components'),`,
    `${indent}assets: path.resolve(__dirname, 'src/assets')${redux ? ',' : ''}`,
    redux && aliasReduxObject,
    `${indent.slice(2)}},` // Closing bracket indented 2 spaces closer.
  ].filter(Boolean).join('\n')

  return config.replace(aliasPlaceholder, aliasObject)
}

module.exports = webpackConfig
