const isProd = process.env.NODE_ENV === 'production'
const purgeCss = require('@fullhuman/postcss-purgecss')
const globAll = require('glob-all')
const noComment = require('postcss-discard-comments')
const mqPacker = require('css-mqpacker')
const combineSelectors = require('postcss-combine-duplicated-selectors')
const autoprefixer = require('autoprefixer')
const colormin = require('postcss-colormin').default
const sorter = require('css-declaration-sorter')
// const whitelister = require('purgecss-whitelister')


/*
  Why we scope `purgeCss` to production only.
  -------------------------------------------
  During development, CSS assets may have been previously purged
  from a webpack reload or initial load. You might try to add classes in JS
  and see no change. This avoids that.
*/
module.exports = {
  plugins: [
    // http://bit.ly/2Xtfwao - explains why we're using purge-css here and not as a Webpack plugin.
    isProd && purgeCss({
      // Optionally whitelist 3rd party libraries:
      // whitelist: whitelister('./node_modules/some-library/styles.css'),
      content: globAll.sync([
        './src/**/*.js',
        './src/**/*.jsx',
        './src/index.ejs'
      ], { absolute: true }),
      keyframes: false // http://bit.ly/2Xnsqq2
    }),
    noComment(),
    mqPacker({ sort: true }),
    combineSelectors({ removeDuplicatedProperties: true }),
    autoprefixer(),
    colormin(),
    sorter()
  ].filter(Boolean)
}
