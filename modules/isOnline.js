// Checks if the user is online.
// Another good package for this is `connectivity` - https://goo.gl/3zxtLa

const { exec } = require('child_process');

module.exports = () => new Promise((resolve, reject) => {
  exec('curl www.google.com', { stdio: [0, 1, 2] }, (err, stdout, stdin) => {
    resolve(err ? false : !!stdout);
  });
});
