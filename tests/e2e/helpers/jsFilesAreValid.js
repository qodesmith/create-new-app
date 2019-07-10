const fs = require('fs-extra')
const Linter = require('eslint').Linter
const linter = new Linter()
const filesAndFolders = require('../config/filesAndFolders')
const { absolutePathConfig, listFolderContents } = require('./folderFileHelper')
const lintConfig = {
  parserOptions: {
    ecmaVersion: 10,
    sourceType: 'module'
  }
}

function jsFilesAreValid(appPath, appType) {
  const folders = absolutePathConfig(appPath, filesAndFolders[appType])

  const jsFiles = Object.keys(folders).reduce((acc, folder) => {
    const jsFilesInFolder = listFolderContents(folder, { files: true })
      .filter(file => file.endsWith('.js'))

    return acc.concat(jsFilesInFolder)
  }, [])

  const errors = jsFiles.reduce((acc, file) => {
    const fileContents = fs.readFileSync(file, 'utf8')
    const errors = linter.verify(fileContents, lintConfig).filter(e => e.fatal)

    return acc.concat(errors.map(e => ({ ...e, file, /*fileContents*/ })))
  }, [])

  return !errors.length || JSON.stringify(errors, null, 2)
}

module.exports = jsFilesAreValid
