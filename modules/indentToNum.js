/*
  This modules takes in a multi-line string and indents each line by a certain amount.
  It always adds a newline character at the beginning.
*/

function indentToNum(str, num = 0) {
  return '\n' + str
    .split('\n')
    .map(line => `${' '.repeat(num)}${line}`)
    .join('\n')
}

module.exports = indentToNum
