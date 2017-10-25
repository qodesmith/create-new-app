// Another good package for this is `connectivity` - https://goo.gl/3zxtLa

const { exec } = require('child_process');

async function isOnline() {
  const [nope, yup] = await new Promise(resolve => {
    exec('curl www.google.com', { stdio: [0, 1, 2] }, (err, stdout, stdin) => {
      resolve([err || null, stdout || null]);
    });
  });

  return !!yup;
}

module.exports = isOnline;
