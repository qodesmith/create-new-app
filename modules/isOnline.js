/*
  Checks if the user is online.
  Alternative packages:
    * https://goo.gl/UEDXEt - `is-online`
    * https://goo.gl/CcNBxw - `is-reachable`
    * https://goo.gl/3zxtLa - `connectivity`
*/

const dns = require('dns')

module.exports = () => new Promise(resolve => {
  let slow = false

  // Prevent this from taking forever for slow connections.
  const tooSlow = setTimeout(() => {
    slow = true
    console.log('\nYour internet connection appears to be unstable.')
    console.log('Proceeding with offline mode...\n')
    resolve(false)
  }, 3500)

  // https://nodejs.org/api/dns.html
  dns.lookup('google.com', (err, address, family) => {
    clearTimeout(tooSlow)
    !slow && resolve(!err)
  })
})
