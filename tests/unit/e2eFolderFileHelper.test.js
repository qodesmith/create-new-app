const path = require('path')
const {
  listFolderContents,
  getAbsolutePaths,
  listFoldersInTree,
  foldersFromConfig,
  listIgnoredFoldersFromConfig,
  absolutePathConfig
} = require('../e2e/helpers/folderFileHelper')
const dir = txt => `${__dirname}/${txt}`


describe('E2E `folderFileHelper` functions', () => {
  const config1 = {
    './': ['one.js', 'two.js'],
    './test': ['three.js']
  }
  const config2 = {
    ...config1,
    './ignored/one': null,
    './ignored/two/much/longer': null
  }
  const sampleFolderContents = [
    'a',
    'a/a-a',
    'a/a-b',
    'a/a-b-a',
    'a/a-b-a/empty.html',
    'b',
    'b/b-a',
    'b/b-a-a',
    'b/b-a-a/empty.css',
    '.a-dot-file',
    'empty.js'
  ]

  describe('listFolderContents', () => {
    const basePath = path.resolve(__dirname, './sample-folder-dont-delete')

    it('should list all files and folders as absolute paths', () => {
      const expectedResults = ['a', 'b', '.a-dot-file', 'empty.js'].map(file => `${basePath}/${file}`).sort()
      const actualResults = listFolderContents(basePath).sort()

      expect(expectedResults).toEqual(actualResults)
    })

    it('should list only folders when given the `folders` options', () => {
      const expectedResults = ['a', 'b'].map(file => `${basePath}/${file}`).sort()
      const actualResults = listFolderContents(basePath, { folders: true }).sort()

      expect(expectedResults).toEqual(actualResults)
    })

    it('should list only files when given the `files` options', () => {
      const expectedResults = ['.a-dot-file', 'empty.js'].map(file => `${basePath}/${file}`).sort()
      const actualResults = listFolderContents(basePath, { files: true }).sort()

      expect(expectedResults).toEqual(actualResults)
    })

    it('should only give the name of the folder or file when using the `namesOnly` option', () => {
      const expectedResults = ['a', 'b', '.a-dot-file', 'empty.js'].sort()
      const actualResults = listFolderContents(basePath, { namesOnly: true }).sort()

      expect(expectedResults).toEqual(actualResults)
    })

    it('should only list folder names when using `folders` and `namesOnly` options', () => {
      const expectedResults = ['a', 'b']
      const actualResults = listFolderContents(basePath, { namesOnly: true, folders: true }).sort()

      expect(expectedResults).toEqual(actualResults)
    })

    it('should only list file names when using `files` and `namesOnly` options', () => {
      const expectedResults = ['.a-dot-file', 'empty.js']
      const actualResults = listFolderContents(basePath, { namesOnly: true, files: true }).sort()

      expect(expectedResults).toEqual(actualResults)
    })
  })

  describe('getAbsolutePaths', () => {
    it('should return a an array of absolute paths', () => {})
  })

  describe('listFoldersInTree', () => {
    it('should list all the folders in a given directory', () => {})
    it('should list all the folders in a given directory minus those in `ignored`', () => {})
  })

  describe('foldersFromConfig', () => {
    it('should list all folders as absolute paths from a config file except the base path', () => {
      const actualResults1 = foldersFromConfig(__dirname, config1)
      const actualResults2 = foldersFromConfig(__dirname, config2)
      const expectedResults = [dir('test')]

      expect(expectedResults).toEqual(actualResults1)
      expect(expectedResults).toEqual(actualResults2)
    })
  })

  describe('listIgnoredFoldersFromConfig', () => {
    it('should list all ignored folders from a config as absolute paths', () => {
      const actualResults1 = listIgnoredFoldersFromConfig(__dirname, config1)
      const actualResults2 = listIgnoredFoldersFromConfig(__dirname, config2)
      const expectedResults1 = []
      const expectedResults2 = [dir('ignored/one'), dir('ignored/two/much/longer')]

      expect(expectedResults1).toEqual(actualResults1)
      expect(expectedResults2).toEqual(actualResults2)
    })
  })

  describe('absolutePathConfig', () => {
    it('should return a config with the keys being absolute paths minus ignored folders', () => {
      const actualResults1 = absolutePathConfig(__dirname, config1)
      const actualResults2 = absolutePathConfig(__dirname, config2)
      const expectedResults1 = { [__dirname]: ['one.js', 'two.js'], [dir('test')]: ['three.js'] }

      expect(expectedResults1).toEqual(actualResults1)
      expect(expectedResults1).toEqual(actualResults2)
    })
  })
})
