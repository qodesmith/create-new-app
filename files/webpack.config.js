require('dotenv').load(); // https://goo.gl/Cj8nKu
const { NODE_ENV } = process.env
const isProd = NODE_ENV === 'production';
const path = require('path');
const glob = require('glob-all');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;


console.log(`

  +--------------------------------
  |
  |   NODE ENVIRONMENT: ${NODE_ENV}
  |
  +--------------------------------

`);


/*
  https://goo.gl/3BmAqo
  Excellent plain explanation of Webpack stuffs.
*/


const webpackConfig = {
  /*
    https://goo.gl/1JzNCP
    The base directory for resolving entry points & loaders from configuration.
  */
  context: path.resolve(__dirname, 'src'),

  /*
    https://goo.gl/7eTbVQ
    Entry point into our application (relative to `context` above).
  */
  entry: './entry.js',

  /*
    https://goo.gl/7eTbVQ
    Where to place our compiled bundle file.
  */
  output: {
    filename: '[name].[hash].js', // https://goo.gl/9DMd6U
    path: path.resolve(__dirname, 'dist'), // Where webpack should store the result.

    /*
      https://goo.gl/c7M4EB
      Allows for a leading slash in the generated html.
      For opening html files directly in the browser,
      set to an empty string - i.e. when no server is really needed.
    */
    publicPath: '/'
  },

  /*
    https://goo.gl/PAvN8T
    Loaders work at the individual file level during or before the bundle generation.
  */
  module: {
    rules: [
      /*
        https://goo.gl/N6uJv3
        ES6+ => ES5
      */
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'), // https://goo.gl/4i8FJ3
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              /*
                To get tree shaking working, we need the `modules: false` below.

                https://goo.gl/4vZBSr - 2ality blog mentions that the issue is caused
                by under-the-hood usage of `transform-es2015-modules-commonjs`.

                https://goo.gl/sBmiwZ - A comment on the above post shows that we
                can use `modules: false`.

                https://goo.gl/fg7zPE - `babel-preset-env` documentation.
              */
              // 'env',
              [
                'env',
                {
                  targets: {
                    browsers: 'last 2 versions'
                  },
                  modules: false // Needed for tree shaking to work.
                }
              ],
              'react' // Calls `babel-preset-react` - makes JSX possible.
            ],
            plugins: [
              /*
                https://goo.gl/GKDWnQ, https://goo.gl/8BUXWt
                Need for certain uses of `...rest`.
              */
              'transform-object-rest-spread'
            ]
          }
        }
      },

      /*
        https://goo.gl/GXtRGf, https://goo.gl/fFiekT, https://goo.gl/rHd8B2
        Import a SCSS file from JS (indicate which assets are needed).
      */
      {
        test: /\.(scss|css)$/,

        // Creates a single CSS file with all the styles.
        use: ExtractTextPlugin.extract({
          // Injects a <style> tag with all the CSS import styles.
          fallback: 'style-loader',
          use: [
            // Enables the import.
            {
              loader: 'css-loader',
              options: {
                minimize: isProd,
                // sourceMap: false
              }
            },

            /*
              https://goo.gl/tXASjg
              Autoprefixer and others (see `postcss.config.js`).
            */
            {
              loader: 'postcss-loader'
            },

            // Loads a scss file and compiles it to css.
            {
              loader: 'sass-loader',
              options: {
                includePaths: [
                  // 'node_modules',
                  'node_modules/tachyons-sass', // For loading the entire Tachyons library.
                  'node_modules/tachyons-sass/scss' // For loading individual Tachyons components.
                ]
              }
            }
          ]
        }),
      },

      /*
        https://goo.gl/8ookzR
        Import image files from JS (resolving to urls).
      */
      {
        test: /\.(jpg|png|svg|gif)$/,
        use: [
          'file-loader'
        ]
      },

      /*
        https://goo.gl/Zerq4J
        Import fonts from JS (resolving to urls).
      */
      {
        test: /\.(ttf|otf|woff|woff2|eot)/,
        use: [
          'file-loader'
        ]
      }
    ]
  },

  /*
    Source maps! https://goo.gl/GfoPkp
    This won't work properly with the `PurifyCSSPlugin` plugin
    for CSS sourcemaps. We're just paying attention to JS maps.
  */
  devtool: isProd ? false : 'source-map',

  // https://goo.gl/KJwi5b
  devServer: {
    // Content not from webpack is served from this directory.
    contentBase: path.resolve(__dirname, 'dist'),

    /*
      https://goo.gl/mgQHiQ
      '...the index.html page will likely have to be served
      in place of any 404 responses.'
    */
    historyApiFallback: true,

    // https://goo.gl/EVMMyC
    port: PLACEHOLDER-PORT,

    /*
      Redirect non-static asset calls
      or unrecognized urls to the backend API server.
      404's will be served `index.html` by `historyApiFallback` above.
    */
    proxy: {
      'PLACEHOLDER-API': 'http://localhost:PLACEHOLDER-APIPORT'
    }
  },

  /*
    https://goo.gl/PAvN8T
    Plugins work at the end of the bundle generation process.
  */
  plugins: [
    /*
      https://goo.gl/hTXPtE
      Used to destroy & rebuild the dist folder each build.
      Used instead of `CleanWebpackPlugin` - https://goo.gl/PtC14x
    */
    new WebpackCleanupPlugin({
      exclude: ['favicon.ico']
    }),

    /*
      https://goo.gl/rHd8B2
      Used in conjunction with the SCSS rule above.
      Removes the css data that's in the JS bundle
      and extracts it into a css file.
    */
    new ExtractTextPlugin('styles.[hash].css'),

    /*
      https://goo.gl/QNGpEi
      Issue with Tachyons: https://goo.gl/nznWhV
      Removes (mostly) unused selectors from your CSS.
      This will use the output of the above `ExtractTextPlugin`
      as the asset to purify, searching the files within the paths option.
    */
    isProd && new PurifyCSSPlugin({
      minimize: isProd,
      verbose: true,
      purifyOptions: { info: true },
      paths: glob.sync([
        // path.resolve(__dirname, 'dist/*.html'),
        // path.resolve(__dirname, 'dist/**/*.css'),
        path.resolve(__dirname, 'src/**/*.js')
      ], { nodir: true }) // `nodir` is a glob thing - https://goo.gl/5sLRY1.
    }),

    /*
      https://goo.gl/pwnnmX, https://goo.gl/og4sNK
      Generates the `index.html` file.
    */
    new HtmlWebpackPlugin({
      // https://goo.gl/9UFR8u
      title: `PLACEHOLDER-TITLE`,

      // Put JS before closing </body> tag & CSS in the <head>.
      inject: true,

      // https://goo.gl/pEyuqu, https://goo.gl/uogJeh
      minify: {
        collapseWhitespace: true
      },

      // Path the the template file.
      template: path.resolve(__dirname, 'src/index.ejs'),

      /*****************************
        Customized things below...
      *****************************/

      // Will color the url bar when viewed on a mobile device.
      mobileThemeColor: 'black',

      // <meta> description of the site.
      description: `PLACEHOLDER-DESCRIPTION`
    }),

    /*
      https://goo.gl/sB6d6b
      Needed in order to use the production-ready minified version of React.
      Avoids warnings in the console.
    */
    isProd && new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),

    /*
      https://goo.gl/4L3vEM
      https://goo.gl/sB6d6b - "For the most efficient webpack production build..."

      Uses uglifyJS v2 (NOT the latest beta release) to minify JavaScript.

      *NOTE* - Tree shaking does NOT seem to be working in UglifyJs at the moment (9/23/2017).
      See the workaround implemented with 'babel-loader' and 'env' above.
      Tree shaking *should* be handled by UglifyJS alone, but its not at the moment.
      Github issues:
        - https://github.com/webpack/webpack/issues/2867
        - https://github.com/webpack/webpack/issues/4784
    */
    isProd && new UglifyJsPlugin({ // Minify options: https://goo.gl/3UaFRm
      compress: { // https://goo.gl/Hn5iiE
        sequences: 200,
        properties: true,
        dead_code: true,
        drop_debugger: true,
        conditionals: true,
        evaluate: true,
        booleans: true,
        // typeofs: false, // Throws `unsupported` error.
        loops: true,
        unused: true,
        if_return: true,
        // inline: true, // Throws `unsupported` error.
        join_vars: true,
        reduce_vars: true,
        warnings: true,
        negate_iife: true,
        passes: 2
      },
      mangle: { // https://goo.gl/6Aq8DB
        toplevel: true
      },
      output: { // https://goo.gl/Qr5uKx
        bracketize: false,
        comments: false,
        keep_quoted_props: false,
        preamble: '// Qode Creative - JavaScript awesomeness.',
        quote_keys: false,
        quote_style: 0
      },
      ie8: false
    })
  ].filter(Boolean)
};

module.exports = webpackConfig;
