/*
  This modules takes in the newly created content for `entry.js`
  and adds a top-level comment to it explaining polyfill options.
*/

const commentContents = [
  '/*',
  '  http://bit.ly/2DTXGpe - `@babel/polyfill` has been deprecated.',
  '  If you need to polyfill certain JS features, uncomment the two imports below.',
  '*/',
  `// import 'core-js/stable'`,
  `// import 'regenerator-runtime/runtime' // Needed to polyfill async / await.`,
].join('\n')

function adjustEntryFile(entryFileContents) {
  return entryFileContents.replace(
    '__PLACEHOLDER_ENTRY_COMMENT__',
    commentContents,
  )
}

module.exports = {
  adjustEntryFile,
  commentContents,
}
