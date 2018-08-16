const purgeCss = require('@fullhuman/postcss-purgecss')
const globAll = require('glob-all')
const noComment = require('postcss-discard-comments')
const mqPacker = require('css-mqpacker')
const combineSelectors = require('postcss-combine-duplicated-selectors')
const autoprefixer = require('autoprefixer')
const colorMin = require('postcss-colormin')
const sorter = require('css-declaration-sorter')
// const whitelister = require('purgecss-whitelister')


module.exports = {
  plugins: [
    // https://goo.gl/igXRk6 - explains why we're using purge-css here and not as a Webpack plugin.
    purgeCss({
      // Optionally whitelist 3rd party libraries:
      // whitelist: whitelister('./node_modules/some-library/styles.css'),
      content: globAll.sync([
        './src/**/*.js',
        './src/**/*.jsx',
        './src/index.ejs'
      ], { absolute: true }),
      keyframes: false // https://goo.gl/18L7bj
    }),
    noComment(),
    mqPacker({ sort: true }),
    combineSelectors({ removeDuplicatedProperties: true }),
    autoprefixer(),
    colorMin(),
    sorter()
  ]
}
