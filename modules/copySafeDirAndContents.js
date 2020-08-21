const fs = require('fs-extra')
const keepOldFileContent = require('./keepOldFileContent')


function copySafeDirAndContents({ sourceFile, sourcePath, destinationPath }, show) {
  // Ensure that the destination directory exists (this will create it if not).
  !sourceFile && fs.ensureDirSync(destinationPath)

  /*
    We're using the `filter` option passed to `copySync` as a shortcut to iterate through
    the contents of the source directory. For each item encountered, we'll safely
    write to the file with `keepOldFileContent` to preserve... old file content :)
  */
  fs.copySync(sourceFile ?? sourcePath, destinationPath, {
    filter: (src, dest) => {
      // Ignore directories and irrelevant files. We'll create the directory below.
      const isDirectory = fs.statSync(src).isDirectory()
      if (show) {
        console.log('SOURCE:', src)
        console.log('DEST:', dest)
        console.log('IS DIR:', isDirectory)
        console.log('-----------')
      }
      if (src.endsWith('.DS_Store')) return false

      if (!isDirectory) {
        // Generate the content safely - existing content will be included, commented out.
        const content = keepOldFileContent({
          sourcePath: src,
          destinationPath: dest,
        })

        // Write the content to the new file, creating it and its directory if they don't exist.
        fs.outputFileSync(destinationPath, content)
      }

      /*
        Ultimately, we return false in every scenario to prevent copySync's default behavior.
        We don't want copySync to actually DO anything.
      */
      return true
    }
  })
}

module.exports = copySafeDirAndContents
