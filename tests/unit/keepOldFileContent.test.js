const keepOldFileContent = require('../../modules/keepOldFileContent')
const fs = require('fs-extra')
const path = require('path')
const tempFolder = path.resolve(__dirname, 'temp-keep-old-file-content-test')
const sourcePath = `${tempFolder}/sourceFile.js`
const destinationPath = `${tempFolder}/destinationFile.js`
const sourceFileContents = "console.log('source file contents')"
const destinationFileContents = "console.log('destination file contents')"
const newContent = '// A comment'


describe('keepOldFileContent', () => {
  // Create temporary folder & file to play with.
  fs.ensureFileSync(sourcePath)
  fs.ensureFileSync(destinationPath)

  // Write the contents of the files.
  fs.writeFileSync(sourcePath, sourceFileContents, 'utf8')
  fs.writeFileSync(destinationPath, destinationFileContents, 'utf8')

  // Create content to test against.
  const oldContentsPreserved = keepOldFileContent({ sourcePath, destinationPath })
  const noContentToOverwrite = keepOldFileContent({ sourcePath, destinationPath: './nope.js' })
  const sourceContentNoOverwrite = keepOldFileContent({ newContent, destinationPath: './nope.js' })
  const sourceContentWithOverwrite = keepOldFileContent({ newContent, destinationPath })

  // Remove all temporary files.
  fs.removeSync(tempFolder)

  it('should copy content from one file and merge it with pre-existing content from the destination file', () => {
    expect(oldContentsPreserved).toMatchSnapshot()
  })

  it('should copy content from one file only, when there is no pre-existing file to overwrite', () => {
    expect(noContentToOverwrite).toMatchSnapshot()
  })

  it('should write content provided only, when there is no pre-existing file to overwrite', () => {
    expect(sourceContentNoOverwrite).toMatchSnapshot()
  })

  it('should write content provided and merge it with pre-existing content from the destination file', () => {
    expect(sourceContentWithOverwrite).toMatchSnapshot()
  })
})
