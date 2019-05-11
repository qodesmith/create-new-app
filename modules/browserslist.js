/*
  Why is something this simple in its own file?
  Because it's used multiple times in multiple places: `main.js` and `packageJson.js`.

  https://goo.gl/2uAdKL - why you should avoid `last 2 versions`.
*/
module.exports = ['>0.25%', 'not ie 11', 'not op_mini all']
