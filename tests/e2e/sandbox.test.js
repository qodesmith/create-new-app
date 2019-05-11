const path = require('path')
const fs = require('fs-extra')
const run = require('../../modules/run')
const { listFolderContents } = require('./helpers/folderFileHelper')


describe('cli - sandbox project', () => {
  const appName = 'sandbox-test' // Ensure the folder ends in `test` to be git ignored.
  const mainPath = path.resolve(__dirname, '../../')
  const appPath = `${mainPath}/${appName}`
  const appContents = ['index.html', 'main.js', 'styles.css']

  beforeAll(() => {
    run(`node ${mainPath}/main.js ${appName} --sandbox`)
  })

  afterAll(() => {
    fs.removeSync(appPath)
  })

  it('should create a sandbox project in the <appName> directory', () => {
    expect(fs.existsSync(appPath)).toBe(true)
  })

  it('should only contain 3 files', () => {
    const folders = listFolderContents(appPath, { folders: true })
    const files = listFolderContents(appPath, { files: true, namesOnly: true })

    expect(folders).toEqual([])
    expect(files.sort()).toEqual(appContents.sort())
  })

  appContents.forEach(file => {
    it(`should populate "${file}" correctly`, () => {
      const fileContents = fs.readFileSync(`${appPath}/${file}`, 'utf8')
      expect(fileContents).toMatchSnapshot()
    })
  })
})
