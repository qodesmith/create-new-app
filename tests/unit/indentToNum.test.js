const indentToNum = require('../../modules/indentToNum')

// Test cases.

const single1 = 'Qodesmith'
const single2 = '  Qodesmith'
const multi1 = `
Qodesmith
`
const multi2 = `
  JavaScript
    Rules!
`


describe('indentToNum', () => {
  it('should take a string (multi-line or not) and add indentation to it', () => {
    expect(indentToNum(single1, 0)).toBe('\nQodesmith')
    expect(indentToNum(single1)).toBe('\nQodesmith')
    expect(indentToNum(single1, 5)).toBe('\n     Qodesmith')
    expect(indentToNum(single2, 5)).toBe(`\n     ${single2}`)
    expect(indentToNum(multi1)).toBe('\n\nQodesmith\n')
    expect(indentToNum(multi2, 3)).toBe('\n   \n     JavaScript\n       Rules!\n   ')
  })
})
