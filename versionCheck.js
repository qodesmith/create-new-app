#!/usr/bin/env node
// Possible permissions errors? - https://goo.gl/mH9n3j

process.on()

const nodeVersion = process.versions.node;

if (nodeVersion[0] < 6) {
  const message = `
    +-------------------------------------------------------------------+
    |                                                                   |
    |  Create New App requires Node >= 6 and npm >= 3.                  |
    |  Please upgrade. The easiest way is to use Node Version Manager:  |
    |    https://github.com/creationix/nvm                              |
    |                                                                   |
    +-------------------------------------------------------------------+
  `;

  console.log(message);
  process.exit(1);
}
