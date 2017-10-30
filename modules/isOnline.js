// Another good package for this is `connectivity` - https://goo.gl/3zxtLa

const { exec } = require('child_process');

function isOnline() {
  return new Promise((resolve, reject) => {
    exec('curl www.google.com', { stdio: [0, 1, 2] }, (err, stdout, stdin) => {
      resolve(err ? false : !!stdout);
    });
  });
}

module.exports = isOnline;
