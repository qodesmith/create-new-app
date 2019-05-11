/*
  This module checks if the user is online.
  If it takes more than 3.5s, it will assume a bad connection
  and the process will proceed as if the user is offline.

  Alternative packages:
    * https://goo.gl/UEDXEt - `is-online`
    * https://goo.gl/CcNBxw - `is-reachable`
    * https://goo.gl/3zxtLa - `connectivity`
*/

const dns = require('dns')

module.exports = (time = 3500) => new Promise(resolve => {
  let slow = false

  // Prevent this from taking forever for slow connections.
  const tooSlow = setTimeout(() => {
    slow = true
    console.log('\nYour internet connection appears to be unstable.')
    console.log('Proceeding with offline mode...\n')
    resolve(false)
  }, time)

  /*
    https://nodejs.org/api/dns.html
    Use `.resolve` over `.lookup` since the former will always perform a network request.
  */
  dns.resolve('google.com', (err, records) => {
    clearTimeout(tooSlow)
    !slow && resolve(!err)
  })
})
