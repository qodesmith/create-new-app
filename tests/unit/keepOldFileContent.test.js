const keepOldFileContent = require('../../modules/keepOldFileContent')
const fs = require('fs-extra')
const path = require('path')
const tempFolder = path.resolve(__dirname, 'temp-keep-old-file-content-test')
const sourcePath = `${tempFolder}/sourceFile.js`
const destinationPathJs = `${tempFolder}/destinationFile.js`
const destinationPathDot = `${tempFolder}/.dotDestinationFile`
const sourceFileContents = "console.log('source file contents')"
const destinationFileContents = "console.log('destination file contents')"
const newContent = '// A comment'

describe('keepOldFileContent', () => {
  // Create temporary folder & files to play with.
  fs.ensureFileSync(sourcePath)
  fs.ensureFileSync(destinationPathJs)
  fs.ensureFileSync(destinationPathDot)

  // Write the contents of the temporary files.
  fs.writeFileSync(sourcePath, sourceFileContents, 'utf8')
  fs.writeFileSync(destinationPathJs, destinationFileContents, 'utf8')
  fs.writeFileSync(destinationPathDot, destinationFileContents, 'utf8')

  // Create content to test against.
  const oldContentsPreservedJs = keepOldFileContent({
    sourcePath,
    destinationPath: destinationPathJs,
  })
  const oldContentsPreservedDot = keepOldFileContent({
    sourcePath,
    destinationPath: destinationPathDot,
  })
  const noContentToOverwriteJs = keepOldFileContent({
    sourcePath,
    destinationPath: './nope.js',
  })
  const noContentToOverwriteDot = keepOldFileContent({
    sourcePath,
    destinationPath: './.dotNope',
  })
  const sourceContentNoOverwriteJs = keepOldFileContent({
    newContent,
    destinationPath: './nope.js',
  })
  const sourceContentNoOverwriteDot = keepOldFileContent({
    newContent,
    destinationPath: './.dotNope',
  })
  const sourceContentWithOverwriteJs = keepOldFileContent({
    newContent,
    destinationPath: destinationPathJs,
  })
  const sourceContentWithOverwriteDot = keepOldFileContent({
    newContent,
    destinationPath: destinationPathDot,
  })

  // Remove all temporary files.
  fs.removeSync(tempFolder)

  it('should copy content from one file and merge it with pre-existing content from the destination file', () => {
    expect(oldContentsPreservedJs).toMatchSnapshot()
    expect(oldContentsPreservedDot).toMatchSnapshot()
  })

  it('should copy content from one file only, when there is no pre-existing file to overwrite', () => {
    expect(noContentToOverwriteJs).toMatchSnapshot()
    expect(noContentToOverwriteDot).toMatchSnapshot()
  })

  it('should write content provided only, when there is no pre-existing file to overwrite', () => {
    expect(sourceContentNoOverwriteJs).toMatchSnapshot()
    expect(sourceContentNoOverwriteDot).toMatchSnapshot()
  })

  it('should write content provided and merge it with pre-existing content from the destination file', () => {
    expect(sourceContentWithOverwriteJs).toMatchSnapshot()
    expect(sourceContentWithOverwriteDot).toMatchSnapshot()
  })
})
