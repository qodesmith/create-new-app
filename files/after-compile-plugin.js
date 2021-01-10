const { DEV_SERVER_PORT, API, API_PORT } = process.env
const os = require('os')


/*
  This is a custom Webpack plugin that simply runs a function after each build.
  In Create New App, this is used to console.log the urls to the application
  in the browser as well as (conditionally) the api server url.
*/
class AfterCompilePlugin {
  constructor({ run } = {}) {
    this.run = run
  }

  defaultRun() {
    API && console.log(`🌎  => API listening on port ${API_PORT}...`)
    console.log('💻  => Application running in browser at:')
    console.log(`         • Local:            http://localhost:${DEV_SERVER_PORT}`)
    console.log(`         • On your network:  http://${getLocalIpAddress()}:${DEV_SERVER_PORT}\n\n`)
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('AfterCompilePlugin', compilation => {
      const stats = compilation.getStats()
      // https://bit.ly/38vBDow
      const errors = compilation.errors

      /*
        Using `setTimeout` here simply bumps running `this.run()`
        to *after* Webpack has spewed a ton of stuff into the console.
        The idea is to have the url's mentioned above logged at the
        very last moment so they're the last thing the user sees.
      */
      setTimeout(() => {
        // console.log('????????', stats)

        // 1. Determine if we have an error in the build.
        const hasErrors = !!errors.length

        // 2a. If no error, clear the screen.
        if (!hasErrors) {
          // http://bit.ly/2Z7GZ1M - clear the console.
          console.log('\x1Bc')
        }

        // 3a. If error, do nothing.
        if (hasErrors) return

        // 3. Print the url's to the console.
        this.defaultRun()
        this.run && this.run()
      }, 0)
    })
  }
}

/*
  Get the local IP address for this computer.
  We want to print this to the console instead of 'localhost' since this address
  can be used to connect other mobile devices on the same network for testing.
*/
function getLocalIpAddress() {
  const obj = Object
    .values(os.networkInterfaces())
    .reduce((acc, arr) => acc.concat(arr), [])
    .find(({family, internal}) => family === 'IPv4' && !internal)

  return obj ? obj.address : '0.0.0.0'
}

module.exports = AfterCompilePlugin
