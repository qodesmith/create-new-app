/*
  This module will either safely copy a file or a directory and all it's contents.
  It uses the `keepOldFileContent` module to ensure no existing data is overwritten.
*/

const fs = require('fs-extra')
const path = require('path')
const keepOldFileContent = require('./keepOldFileContent')


function copySafe({ sourcePath, destinationPath }) {
  const stats = fs.statSync(sourcePath)
  const isDirectory = stats.isDirectory()

  // DIRECTORIES
  if (isDirectory) {
    // Create the directory if it doesn't already exist.
    fs.ensureDirSync(destinationPath)

    // Get the contents of the source directory.
    const dirContents = fs.readdirSync(sourcePath)

    // Call this function recursively on the contents of this directory.
    dirContents.forEach(item => {
      console.log('ITEM:', item)
      copySafe({
        sourcePath: `${sourcePath}/${item}`,
        destinationPath: `${destinationPath}/${item}`,
      })
    })

  // FILES
  } else {
    if (sourcePath.endsWith('.DS_Store')) return // Ignore `.DS_Store` files.
    const newFileContents = keepOldFileContent({ sourcePath, destinationPath })
    const destinationDir = path.resolve(destinationPath, '..')

    fs.ensureDirSync(destinationDir) // In case the directory for the new file doesn't exist, create it.
    fs.writeFileSync(destinationPath, newFileContents, 'utf8')
  }
}

module.exports = copySafe
