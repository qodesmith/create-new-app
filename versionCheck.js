#!/usr/bin/env node
// Possible permissions errors? - http://bit.ly/2Z5PKsZ

let nodeVersion

try {
  nodeVersion = +process.version.split('.')[0].slice(1)
} catch (e) {}

const spaces = ' '.repeat(38 - nodeVersion.toString().length)

if (nodeVersion !== undefined && nodeVersion < 6) {
  const message = `
    ╭───────────────────────────────────────────────────────────────────╮
    │                                                                   │
    │  Create New App requires Node >= 6 and npm >= 3.                  │
    │  You're using Node version ${nodeVersion}.${spaces}│
    │  Please upgrade. The easiest way is to use Node Version Manager:  │
    │    https://github.com/creationix/nvm                              │
    │                                                                   │
    ╰───────────────────────────────────────────────────────────────────╯
  `

  console.log(message)
  process.exit(1)
}
