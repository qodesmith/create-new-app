/*
  This module will create CONTENTS for the `postcss-config.js` file.
  If the user used the --force option, this module will prepend the existing contents
  commented out to avoid potential conflict.
*/

const fs = require('fs-extra')


function postcssConfig({ destinationPath, newContentPath }) {
  const cautionMessage = [
    '///////////////////////////////////////////////////////////////////',
    '//        The contents of this file have been modified by        //',
    '// create-new-app (https://github.com/qodesmith/create-new-app). //',
    '//      The original contents have been commented out below.     //',
    '///////////////////////////////////////////////////////////////////',
    '\n'
  ].join('\n')

  // Check for the original file & comment out existing content.
  let postcssOriginalContent = ''
  try {
    postcssOriginalContent = fs.readFileSync(destinationPath, 'utf8')
      .split('\n')
      .map((lineContent, i, arr) => {
        if (i === arr.length - 1 && !lineContent.trim()) return '' // Avoid commenting out a blank last line.
        return `// ${lineContent}`
      })
      .join('\n')
  } catch (e) {}

  const newContent = fs.readFileSync(newContentPath, 'utf8')

  if (postcssOriginalContent) {
    return [
      cautionMessage,
      newContent,
      '\n\n',
      '/////////////////////////////',
      '// ORIGINAL CONTENTS BELOW //',
      '/////////////////////////////',
      '\n',
      postcssOriginalContent,
    ].join('\n')
  }

  return newContent
}

module.exports = postcssConfig
