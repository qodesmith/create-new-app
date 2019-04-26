const fs = require('fs-extra')
const path = require('path')


/*
  Returns an array containing the contents of a folder.
  Can optionally list only folders, only files,
  and / or return only the names without the preceding paths.
*/
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

/*
  Returns an array of absolute paths.
  Takes a base path and resolves that with relative paths.
*/
function getAbsolutePaths(basePath, folders = []) {
  return folders.map(folder => path.resolve(basePath, folder))
}

/*
  Returns an array of absolute paths for folders within a directory.
  `ignores` is an array of strings to ignore. If a match is found that begins
  with anything in the `ignores` array, those matches will be ignore.
  Recursively calls itself.
  Used as a helper function in `listAllFoldersInTree`.
*/
function listFoldersInTree(basePath, { ignores = [] } = {}) {
  return listFolderContents(basePath, { folders: true })
    .reduce((acc, folder) => {
      if (ignores.some(ignored => folder.startsWith(ignored))) return acc
      return [...acc, folder, ...listFoldersInTree(folder, { ignores })]
    }, [])
}

/*
  Returns an array of absolute paths of folders derived from a config object.
  Uses `config` to derive which folders to ignore.
  Each folder corresponds to a key in `config`.
  Ignored folders are those in the object that have falsey values.
*/
function foldersFromConfig(basePath, config = {}) {
  const allFolders = Object.keys(config)
  const ignoredFolders = allFolders.filter(folder => !config[folder])
  const ignores = getAbsolutePaths(basePath, ignoredFolders)

  return listFoldersInTree(basePath, { ignores })
}

function listIgnoredFoldersFromConfig(basePath, config) {
  const relativePaths = Object
    .keys(config)
    .reduce((acc, key) => {
      return config[key] ? acc : [...acc, key]
    }, [])

  return getAbsolutePaths(basePath, relativePaths)
}

module.exports = {
  foldersFromConfig,
  listFoldersInTree,
  listIgnoredFoldersFromConfig
}
