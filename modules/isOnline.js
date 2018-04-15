/*
  Checks if the user is online.
  Alternative packages:
    * https://goo.gl/UEDXEt - `is-online`
    * https://goo.gl/CcNBxw - `is-reachable`
    * https://goo.gl/3zxtLa - `connectivity`
*/

const { exec } = require('child_process')

module.exports = () => new Promise(resolve => {
  let slow = false

  // Prevent this from taking forever for slow connections.
  const tooSlow = setTimeout(() => {
    slow = true
    console.log('\nYour internet connection appears to be unstable...\n')
    resolve(false)
  }, 3500)

  exec('curl www.google.com', { stdio: [0, 1, 2] }, (err, stdout, stdin) => {
    clearTimeout(tooSlow)
    !slow && resolve(err ? false : true)
  })
})
