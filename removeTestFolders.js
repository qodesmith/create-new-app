/*
  Why this script?

  Each e2e test includes an `afterAll` call which should delete the
  test project folder it created, however I noticed sometimes a straggling
  folder was left behind (perhaps due to a failed test?).

  This script is run after the test suite completes - pass or fail.
  Another thing to note is that folders that end with `test` are git-ignored.
*/

const fs = require('fs-extra')
const path = require('path')
const dir = path.resolve()
const removedFolders = []

if (process.env.REMAIN) {
  console.log('\nKeeping project folders!\n')
  process.exit(0)
}


fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
  const item = dirent.name
  const fullPath = `${dir}/${item}`
  const isDirectory = dirent.isDirectory()

  if (isDirectory && item.endsWith('test')) {
    removedFolders.push(fullPath)
    fs.removeSync(fullPath)
  }
})

if (removedFolders.length) {
  console.log('\nRemoved the following folders manually:')
  removedFolders.forEach(folder => console.log(`  * ${folder}`))
  console.log('')
} else {
  console.log('\nNo folders needed to be removed manually!\n')
}
