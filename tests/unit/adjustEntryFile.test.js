const adjustEntryFile = require('../../modules/adjustEntryFile')
const providedContent = 'abc'
const results = adjustEntryFile(`__PLACEHOLDER_ENTRY_COMMENT__\n${providedContent}`)
const lines = results.split('\n')
const commentContents = [
  '/*',
  '  http://bit.ly/2DTXGpe - `@babel/polyfill` has been deprecated.',
  '  If you need to polyfill certain JS features, uncomment the two imports below.',
  '  Be sure to adjust the `browserslist` field in your `package.json` file.',
  '*/',
  "// import 'core-js/stable'",
  "// import 'regenerator-runtime/runtime' // Needed to polyfill async / await."
]

describe('adjustEntryFile', () => {
  it('should generated a multi-line comment at the top of the file', () => {
    commentContents.forEach((line, i) => expect(lines[i]).toBe(line))
  })

  it('should indent the multi-line comment from 0.', () => {
    expect(lines[0]).toBe('/*')
  })

  it('should write the provided contents to the file', () => {
    const expectedResults = [...commentContents, providedContent].join('\n')
    expect(results).toBe(expectedResults)
  })
})
