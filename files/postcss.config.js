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
  NOTE:
  We need to scope `purgeCss` to production.
  During development, CSS assets may have been previously purged,
  leaving incomplete classes to play with when changing your JavaScript.
  You might try to add classes in JS and see no change. This avoids that.
*/
module.exports = {
  plugins: [
    // https://goo.gl/igXRk6 - explains why we're using purge-css here and not as a Webpack plugin.
    isProd && purgeCss({
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
    colormin(),
    sorter()
  ].filter(Boolean)
}
