export const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const letters = 'abcdef'
const numbers = '0123456789'
export const randomHexColor = (hex = '') => {
  if (hex.length === 6) return `#${hex}`

  const set = randomNum(0,1) ? letters : numbers
  const num = randomNum(0, set.length - 1)

  return randomHexColor(`${hex}${set[num]}`)
}
