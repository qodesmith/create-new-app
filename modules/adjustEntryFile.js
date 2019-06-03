/*
  This modules takes in the newly created content for `entry.js`
  and adds a top-level comment to it explaining polyfill options.
*/

const indentFromZero = require('./indentFromZero')

function adjustEntryFile(entryFileContents) {
  const commentContents = `
    /*
      http://bit.ly/2DTXGpe - \`@babel/polyfill\` has been deprecated.
      If you need to polyfill certain JS features, uncomment the two imports below.
      Be sure to adjust the \`browserslist\` field in your \`package.json\` file.
    */
    // import 'core-js/stable'
    // import 'regenerator-runtime/runtime' // Needed to polyfill async / await.
  `

  // Remove the leading & trailing newline created by the template literal,
  // ensuring the whole thing has 0 indentation.
  const properlyIndentedComment = indentFromZero(commentContents)
    .split('\n')
    .filter(Boolean)
    .join('\n')

  return entryFileContents.replace('__PLACEHOLDER_ENTRY_COMMENT__', properlyIndentedComment)
}

module.exports = adjustEntryFile
