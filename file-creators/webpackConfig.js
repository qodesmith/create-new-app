const fs = require('fs')
const path = require('path')

function webpackConfig({ redux, server }) {
  const aliasPlaceholder = '@@__PLACEHOLDER_WEBPACK_ALIAS__@@'
  const logPortsPlaceholder = '@@__PLACEHOLDER_WEBPACK_LOG_PORTS__@@'
  const filePath = path.resolve(__dirname, '../files/webpack.config.js')
  const config = fs.readFileSync(filePath, 'utf-8')
  const lines = config.split('\n')

  // Which line #'s' has the placeholders.
  const aliasLineNum = lines.findIndex(line => line.includes(aliasPlaceholder))
  const logPortsNum = lines.findIndex(line => line.includes(logPortsPlaceholder))

  // The line contents.
  const aliasLine = lines[aliasLineNum]
  const logPortsLine = lines[logPortsNum]

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

  // Construct a console.log that will tell where the application is running.
  const devServerLog = [
    "if (NODE_ENV !== 'production') {\n",
    "  console.log(`  💻 => Application running in browser at http://localhost:${DEV_SERVER_PORT}",
    server ? '' : '\\n\\n',
    '`)',
  ].join('')

  // Construct the final console.log's that might also include the API port.
  const consoleLogs = [
    devServerLog,
    server && "  console.log(`  🌎 => API listening on port ${API_PORT}...\\n\\n`)",
    '} else {',
    "  console.log('Building for production...\\n\\n'",
    '}'
  ].filter(Boolean).join('\n')

  return (
    config
      .replace(aliasPlaceholder, aliasObject)
      .replace(logPortsPlaceholder, consoleLogs)
  )
}

module.exports = webpackConfig