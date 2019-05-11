/*
  This modules takes a multi-line string and ensures that its
  left-most content starts at 0-indentation, maintaining all
  other indented lines from there.
*/

function findLeadingSpaces(str) {
  const index = str.split('').findIndex(letter => letter !== ' ')
  return index < 0 ? 0 : index
}

function indentFromZero(str, { both, first, last } = {}) {
  let lines = str
    .split('\n')
    .map(line => line.trim() ? line : '')

  const [smallestIndent] = lines
    .filter(Boolean) // Filter out lines that are just empty strings.
    .map(findLeadingSpaces)
    .sort((a, b) => a > b ? 1 : a < b ? -1 : 0)

  /*
    Why these options? Because in our usage of this module we might
    introduce newline characters at the beginning and the end.
    This is an option to remove those so we're focused only on the content.
  */
  if (both) {
    lines = lines.slice(1, -1)
  } else {
    if (first) lines = lines.slice(1)
    if (last) lines = lines.slice(0, -1)
  }

  return lines
    .map(line => line.slice(smallestIndent))
    .join('\n')
}

module.exports = indentFromZero
