const letters = 'abcdef'
const numbers = '0123456789'
export const randomHexColor = () => (
  letters.split('').reduce(hex => {
    const set = randomNum(0, 1) ? letters : numbers
    const index = randomNum(0, set.length - 1)
    return `${hex}${set[index]}`
  }, '#')
)
