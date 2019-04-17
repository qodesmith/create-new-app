const adjustEntryFile = require('../../modules/adjustEntryFile')
const providedContent = 'abc'
const results = adjustEntryFile(`__PLACEHOLDER_ENTRY_COMMENT__\n${providedContent}`)
const lines = results.split('\n')
const commentContents = [
  '/*',
  '  https://goo.gl/mw8Ntd - `@babel/polyfill` has been deprecated.',
  '  If you need to polyfill certain JS features, uncomment the two imports below.',
  '  Be sure to adjust the `browserslist` field in your `package.json` file.',
  '*/',
  "// import 'core-js/stable'",
  "// import 'regenerator-runtime/runtime' // Needed to polyfill async / await."
]

describe('adjustEntryFile', () => {
  it('should generated a multi-line comment at the top of the file', () => {
    const allLinesTheSame = commentContents.every((line, i) => lines[i] === line)
    expect(allLinesTheSame).toBe(true)
  })

  it('should indent the multi-line comment from 0.', () => {
    expect(lines[0][0] !== ' ').toBe(true)
  })

  it('should write the provided contents to the file', () => {
    results.includes(providedContent)
  })
})