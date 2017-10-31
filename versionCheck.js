#!/usr/bin/env node
// Possible permissions errors? - https://goo.gl/mH9n3j

const nodeVersion = process.versions.node;
const spaces = ' '.repeat(43 - nodeVersion.length);

if (nodeVersion[0] < 6) {
  const message = `
    +-------------------------------------------------------------------+
    |                                                                   |
    |  Create New App requires Node >= 6 and npm >= 3.                  |
    |  You're using version ${nodeVersion}.${spaces}|
    |  Please upgrade. The easiest way is to use Node Version Manager:  |
    |    https://github.com/creationix/nvm                              |
    |                                                                   |
    +-------------------------------------------------------------------+
  `;

  console.log(message);
  process.exit(1);
}
