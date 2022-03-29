#!/usr/bin/env node
// Possible permissions errors? - http://bit.ly/2Z5PKsZ

let nodeVersion = ''

try {
  //     v10    13     1
  const [major, minor, _patch] = process.versions.node.split('.')
  nodeVersion = `${major}.${minor}`
} catch (e) {}

const spaces = ' '.repeat(38 - nodeVersion.length)

if (+nodeVersion < 10.13) {
  const message = [
    '╭───────────────────────────────────────────────────────────────────╮',
    '│                                                                   │',
    '│  Create New App requires Node >= 10.13.0 and npm >= 7             │',
    `│  You're using Node version ${process.version} ${spaces}│`,
    '│                                                                   │',
    '│  Please upgrade Node                                              │',
    '│  The easiest way is to use Node Version Manager:                  │',
    '│    https://github.com/creationix/nvm                              │',
    '│                                                                   │',
    '╰───────────────────────────────────────────────────────────────────╯',
  ].join('\n')

  console.warn(message)
  process.exit(1)
}
