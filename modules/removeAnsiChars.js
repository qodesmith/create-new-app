/*
  https://stackoverflow.com/a/25245824
  Remove ANSI color characters (this is a bold cyan "hello"):
  '\u001b[1m\u001b[36mhello\u001b[39m\u001b[22m'.replace(/\u001b\[.*?m/g, '')
*/
function removeAnsiChars(text) {
  return text.replace(/\u001b\[.*?m/g, '')
}

module.exports = removeAnsiChars
