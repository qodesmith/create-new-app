/*
  This module will create CONTENTS for a given source path, including existing
  content the target file exists already.

  It looks to see if the file exists, comments out all that content, prepends
  a message at the top of the file saying it did so, then write the new
  content below the prepended message.

  All this kicks in if the user used the `--force` option.
  We don't want to overwrite user data.
*/

const fs = require('fs-extra')


function keepOldFileContent({ sourcePath, destinationPath, newContent }) {
  const cautionMessage = [
    '///////////////////////////////////////////////////////////////////',
    '//        The contents of this file have been modified by        //',
    '// create-new-app (https://github.com/qodesmith/create-new-app). //',
    '//      The original contents have been commented out below.     //',
    '///////////////////////////////////////////////////////////////////',
    '\n'
  ].join('\n')

  // Check for the original file & comment out existing content.
  let originalContent = null
  try {
    originalContent = fs.readFileSync(destinationPath, 'utf8')
      .split('\n')
      .map((lineContent, i, arr) => {
        if (i === arr.length - 1 && !lineContent.trim()) return '' // Avoid commenting out a blank last line.
        return `// ${lineContent}`
      })
      .join('\n')
  } catch (e) {}

  const finalContent = newContent ?? fs.readFileSync(sourcePath, 'utf8')

  if (originalContent) {
    return [
      cautionMessage,
      finalContent,
      '\n\n',
      `/${'*'.repeat(78)}/`,
      `/${'*'.repeat(26)} ORIGINAL CONTENTS BELOW ${'*'.repeat(27)}/`,
      `/${'*'.repeat(78)}/`,
      '\n',
      originalContent,
    ].join('\n')
  }

  return finalContent
}

module.exports = keepOldFileContent
