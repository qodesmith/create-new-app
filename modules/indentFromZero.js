function findLeadingSpaces(str) {
  return str.split('').findIndex(letter => letter !== ' ')
}

function indentFromZero(str) {
  const lines = str
  .split('\n')
  .map(line => line.trim() ? line : '')

const [smallestIndent] = lines
  .filter(Boolean) // Filter out lines that are just empty strings.
  .map(findLeadingSpaces)
  .sort((a, b) => a > b ? 1 : a < b ? -1 : 0)

  return lines
    .map(line => line.slice(smallestIndent))
    .join('\n')
}

module.exports = indentFromZero
