const indentFromZero = require('../../modules/indentFromZero')

// Test cases.
const single1 = '   Straight from the slums of Shaolin.'
const single2 = 'Rapping On Tracks => Working On Tracks => JavaScript Awesomeness™'
const multi1 = `
Already
  at
    zero
`
const multi1FirstAnswer = `Already
  at
    zero
`
const multi1LastAnswer = `
Already
  at
    zero`
const multi1BothAnswer = `Already
  at
    zero`
const multi2 = `

    Indented already.
    Another line.
                                    Super indented.
`
const multi2FirstAnswer = `
Indented already.
Another line.
                                Super indented.
`
const multi2LastAnswer = `

Indented already.
Another line.
                                Super indented.`
const multi2BothAnswer = `
Indented already.
Another line.
                                Super indented.`
const multi2Answer = `

Indented already.
Another line.
                                Super indented.
`
const multi3 = `          One.
Two.
`
const multi4 = `          Qode.
          Smith.`
const multi4Answer = `Qode.
Smith.`

describe('indentFromZero', () => {
  it('should take a string (multi-line or not) and start its indentation at 0', () => {
    expect(indentFromZero('')).toBe('')
    expect(indentFromZero(single1)).toBe(single1.trim())
    expect(indentFromZero(single2)).toBe(single2)
    expect(indentFromZero(multi1)).toBe(multi1)
    expect(indentFromZero(multi2)).toBe(multi2Answer)
    expect(indentFromZero(multi3)).toBe(multi3)
    expect(indentFromZero(multi4)).toBe(multi4Answer)
  })

  describe('options', () => {
    it('should remove the first newline character', () => {
      expect(indentFromZero(multi1, { first: 1 })).toBe(multi1FirstAnswer)
      expect(indentFromZero(multi2, { first: 1 })).toBe(multi2FirstAnswer)

    })

    it('should remove the last newline character', () => {
      expect(indentFromZero(multi1, { last: 1 })).toBe(multi1LastAnswer)
      expect(indentFromZero(multi2, { last: 1 })).toBe(multi2LastAnswer)

    })

    it('should remove both the first and last newline characters', () => {
      expect(indentFromZero(multi1, { both: 1 })).toBe(multi1BothAnswer)
      expect(indentFromZero(multi2, { both: 1 })).toBe(multi2BothAnswer)
    })
  })
})
