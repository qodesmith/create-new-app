/*
  This helper function takes in a multi-line string
  and indents each line by a certain amount.
*/

function indentToNum(num = 0, str) {
  return '\n' + str
    .split('\n')
    .map(line => `${' '.repeat(num)}${line}`)
    .join('\n')
}

module.exports = indentToNum
