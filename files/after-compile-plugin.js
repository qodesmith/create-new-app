const {DEV_SERVER_PORT, API, API_PORT} = process.env
const chalk = require('chalk')
const os = require('os')

/*
  This is a custom Webpack plugin that simply runs a function after each build.
  In Create New App, this is used to console.log the urls to the application
  in the browser as well as (conditionally) the api server url.
*/

class AfterCompilePlugin {
  constructor({run} = {}) {
    this.run = run
  }

  defaultRun() {
    console.log('\x1Bc') // http://bit.ly/2Z7GZ1M - clear the console.
    console.log(chalk.greenBright('Webpack compiled successfully!\n'))

    if (API) {
      const fetchMsg = `${chalk.yellow('fetch')}(${chalk.keyword('orange')(
        `'${API}/<your-endpoint>'`,
      )})`
      const thenMsg = `.${chalk.yellow('then')}(...)`
      const fetchExample = `${fetchMsg}${thenMsg}`

      console.log(
        `🌎  => API listening on port ${chalk.blue.bold(API_PORT)}...`,
      )
      console.log(
        '       You can make fetch requests to your API from the browser:',
      )
      console.log(`           ${chalk.italic(fetchExample)}\n`)
      console.log(
        chalk.dim(
          '────────────────────────────────────────────────────────────────────\n',
        ),
      )
    }

    console.log('💻  => Application being served at...')
    console.log(
      `         • ${chalk.bold(
        'Browser:',
      )}                     http://localhost:${chalk.blue.bold(
        DEV_SERVER_PORT,
      )}`,
    )
    console.log(
      `         • ${chalk.bold(
        'Any device on your network:',
      )}  http://${getLocalIpAddress()}:${chalk.blue.bold(DEV_SERVER_PORT)}`,
    )
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('AfterCompilePlugin', compilation => {
      const stats = compilation.getStats()
      // https://bit.ly/38vBDow
      const errors = compilation.errors

      /*
        Using `setTimeout` here simply bumps running `this.run()` to *after*
        Webpack has spewed a ton of stuff into the console. The idea is to have
        the url's mentioned above logged at the very last moment so they're the
        last thing the user sees.
      */
      setTimeout(() => {
        // 1. If we have errors, do nothing.
        if (!!errors.length) return

        // 2. Print the url's to the console.
        this.defaultRun()
        this.run && this.run()
      }, 0)
    })
  }
}

/*
  Gets the local IP address for your computer.
  This address, as opposed to 'localhost', is what other devices on the same
  network would use to connect to the development site.
*/
function getLocalIpAddress() {
  const obj = Object.values(os.networkInterfaces())
    .reduce((acc, arr) => acc.concat(arr), [])
    .find(({family, internal}) => family === 'IPv4' && !internal)

  return obj ? obj.address : '0.0.0.0'
}

module.exports = AfterCompilePlugin
