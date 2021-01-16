/*
  This module is used to add comments in a border to files that have been
  overwritten with the `--force` option. The text is centered within the
  comment borders.
*/
function createBorderedCenteredComment(arrayOfComments, commentChar) {
  if (commentChar !== '#' && commentChar !== '//') {
    throw new Error('Invalid comment character. Should be `#` or `//`.')
  }

  const isHash = commentChar === '#'
  const longestCommentLength = arrayOfComments.reduce(
    (acc, comment) => (comment.length > acc ? comment.length : acc),
    0,
  )

  const paddedComments = arrayOfComments.map(comment => {
    const difference = longestCommentLength - comment.length + 2 // 2 = a space at the start & end.
    const paddingStart = ' '.repeat(Math.floor(difference / 2))
    const paddingEnd = ' '.repeat(Math.ceil(difference / 2))

    return [commentChar, paddingStart, comment, paddingEnd, commentChar].join(
      '',
    )
  })

  const additionalTimes = 4 + (isHash ? 0 : 2)

  return [
    (isHash ? '#' : '/').repeat(longestCommentLength + additionalTimes),
    ...paddedComments,
    (isHash ? '#' : '/').repeat(longestCommentLength + additionalTimes),
  ].join('\n')
}

module.exports = createBorderedCenteredComment
