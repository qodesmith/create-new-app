function indentToNum(num = 0, str) {
  return str
    .split('\n')
    .map(line => `${' '.repeat(num)}${line}`)
    .join('\n')
}

module.exports = indentToNum
