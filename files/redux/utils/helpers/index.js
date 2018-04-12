export const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const letters = ['a' ,'b' ,'c' ,'d' ,'e' ,'f']
const numbers = [...Array(10).keys()]
export const randomHexColor = (hex = '') => {
  if (hex.length === 6) return `#${hex}`

  const arr = randomNum(0,1) ? letters : numbers
  const num = randomNum(0, arr.length - 1)

  return randomHexColor(`${hex}${arr[num]}`)
}
