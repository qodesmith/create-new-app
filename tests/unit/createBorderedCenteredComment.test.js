const createBorderedCenteredComment = require('../../modules/createBorderedCenteredComment')

describe('createBorderedCenteredComment', () => {
  const comments = [`2 "J's" changed my life: Jesus & JavaScript`, 'Qodesmith!']
  const expectedResultsHash = [
    '###############################################',
    `# 2 "J's" changed my life: Jesus & JavaScript #`,
    '#                 Qodesmith!                  #',
    '###############################################',
  ].join('\n')
  const expectedResultsSlash = [
    '/////////////////////////////////////////////////',
    `// 2 "J's" changed my life: Jesus & JavaScript //`,
    '//                 Qodesmith!                  //',
    '/////////////////////////////////////////////////',
  ].join('\n')

  it('should use "#" to create bordered, centered comments', () => {
    const results = createBorderedCenteredComment(comments, '#')
    expect(results).toBe(expectedResultsHash)
  })

  it('should use "//" to create bordered, centered comments', () => {
    const results = createBorderedCenteredComment(comments, '//')
    expect(results).toBe(expectedResultsSlash)
  })
})
