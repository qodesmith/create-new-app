const fs = require('fs-extra')


function listFolderContents(folderPath, { folders, files, namesOnly } = {}) {
  return contents = fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter(dirent => { // https://nodejs.org/api/fs.html#fs_class_fs_dirent
      // https://stackoverflow.com/a/15630832/2525633
      if (folders) return dirent.isDirectory()
      if (files) return dirent.isFile()
      return true
    })
    .map(dirent => namesOnly ? dirent.name : `${folderPath}/${dirent.name}`)
}

module.exports = listFolderContents
