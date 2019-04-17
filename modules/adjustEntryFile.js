/*
  This modules takes in the newly created content for `entry.js`
  and adds a top-level comment to it explaining polyfill options.
*/

const indentFromZero = require('./indentFromZero')

function adjustEntryFile(entryFileContents) {
  const commentContents = `
    /*
      https://goo.gl/mw8Ntd - \`@babel/polyfill\` has been deprecated.
      If you need to polyfill certain JS features, uncomment the two imports below.
      Be sure to adjust the \`browserslist\` field in your \`package.json\` file.
    */
    // import 'core-js/stable'
    // import 'regenerator-runtime/runtime' // Needed to polyfill async / await.
  `

  // Remove the leading & trailing newline created by the template literal
  const commentWithNoExtraLines = commentContents
    .split('\n')
    .filter(line => line.trim())
    .join('\n')

  // Ensure the whole thing has 0 indentation.
  const properlyIndentedComment = indentFromZero(commentWithNoExtraLines)

  return entryFileContents.replace('__PLACEHOLDER_ENTRY_COMMENT__', properlyIndentedComment)
}

module.exports = adjustEntryFile
