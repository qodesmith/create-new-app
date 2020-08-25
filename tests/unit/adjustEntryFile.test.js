const { adjustEntryFile, commentContents } = require('../../modules/adjustEntryFile')
const providedContent = 'abc'
const results = adjustEntryFile(`__PLACEHOLDER_ENTRY_COMMENT__\n${providedContent}`)
const lines = results.split('\n')


describe('adjustEntryFile', () => {
  it('should generated a multi-line comment at the top of the file', () => {
    commentContents.split('\n').forEach((line, i) => expect(lines[i]).toBe(line))
  })

  it('should indent the multi-line comment from 0.', () => {
    expect(lines[0]).toBe('/*')
  })

  it('should write the provided contents to the file', () => {
    const expectedResults = [...commentContents.split(), providedContent].join('\n')
    expect(results).toBe(expectedResults)
  })
})
