/*
  This module will create CONTENTS for the `.gitignore` file.
  If the user used the --force option, this module will prepend the existing contents.
*/

const fs = require('fs-extra')
const path = require('path')


function gitignore({ destinationPath }) {
  // Read the files contents - in the case it already existed, we'll append new contents to it.
  let currentContents = ''
  try {
    currentContents = fs.readFileSync(destinationPath, 'utf8')
  } catch (e) {}

  const fileToCopyPath = path.resolve(__dirname, '../files/gitignore.txt')
  const newContents = fs.readFileSync(fileToCopyPath, 'utf8')

  // Create the leading content of the file.
  const previousContents = !currentContents ? '' : [
    currentContents,
    '\n',
    '###########################################################################',
    '########## THE CONTENT BELOW HAS BEEN APPENDED BY CREATE-NEW-APP ##########',
    '###########################################################################',
    '\n\n'
  ].join('\n')

  return `${previousContents}${newContents}`
}

module.exports = gitignore
