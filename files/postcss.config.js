const isProd = process.env.NODE_ENV === 'production'
const purgeCss = require('@fullhuman/postcss-purgecss')
const combineMediaQuery = require('postcss-combine-media-query')
const combineSelectors = require('postcss-combine-duplicated-selectors')
const autoprefixer = require('autoprefixer')
const sorter = require('css-declaration-sorter')
const nano = require('cssnano')
const path = require('path')
// const whitelister = require('purgecss-whitelister')

/*
  Why we scope `purgeCss` to production only.
  -------------------------------------------
  During development, CSS assets may have been previously purged
  from a webpack reload or initial load. You might try to add classes in JS
  and see no change. This avoids that.
*/
module.exports = {
  plugins: isProd
    ? [
        // http://bit.ly/2Xtfwao - explains why we're using purge-css here and not as a Webpack plugin.
        purgeCss({
          // Optionally whitelist 3rd party libraries:
          // whitelist: whitelister('./node_modules/some-library/styles.css'),
          content: [
            path.resolve(path.resolve(), './src/**/*.js'),
            path.resolve(path.resolve(), './src/**/*.jsx'),
            path.resolve(path.resolve(), './src/index.ejs'),
          ],
          keyframes: false, // http://bit.ly/2Xnsqq2
        }),
        combineSelectors({removeDuplicatedProperties: true}),
        combineMediaQuery(),
        autoprefixer(),
        sorter(),
        nano(),
      ]
    : [],
}
