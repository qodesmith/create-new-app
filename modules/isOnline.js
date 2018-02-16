// Checks if the user is online.
// Another good package for this is `connectivity` - https://goo.gl/3zxtLa

const { exec } = require('child_process');

module.exports = () => new Promise(resolve => {
  let slow = false;

  // Prevent this from taking forever for slow connections.
  const tooSlow = setTimeout(() => ((slow = true) && resolve(false)), 5000);

  exec('curl www.google.com', { stdio: [0, 1, 2] }, (err, stdout, stdin) => {
    clearTimeout(tooSlow);
    !slow && resolve(err ? false : !!stdout);
  });
});
