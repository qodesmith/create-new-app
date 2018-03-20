require('dotenv').load(); // https://goo.gl/Cj8nKu
const { NODE_ENV } = process.env
const isProd = NODE_ENV === 'production';
const path = require('path');
const glob = require('glob-all');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const whitelister = require('purgecss-whitelister'); // https://goo.gl/7B7hbD


console.log(`

  +-----------------------------------+
  |                                   |
      NODE ENVIRONMENT: ${NODE_ENV}
  |                                   |
  +-----------------------------------+

`);


/*
  https://goo.gl/3BmAqo
  Excellent plain explanation of Webpack stuffs.
*/


module.exports = {
  /*
    https://goo.gl/1JzNCP
    The base directory for resolving entry points & loaders from configuration.
  */
  context: path.resolve(__dirname, 'src'),

  /*
    https://goo.gl/7eTbVQ
    Entry point into our application (relative to `context` above).
  */
  entry: [
    /*
      In order to use asyc/await...
      https://goo.gl/u68j23, https://goo.gl/b6iv2R

      Instead of `import 'babel-polyfill'` in our app,
      we ensure it is top-level (executed before *anything* else)
      by making it the 1st entry point.
    */
    '@babel/polyfill',
    './entry.js'
  ],

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

    https://goo.gl/1MKGMm
    Webpack processes things from right to left.

    Imagine a series of functions, each being called with the output of the next:
    loaders: [loader1, loader2, loader3] => loader1(loarder3(loader3(file)))
  */
  module: {
    /*
      https://goo.gl/CmRegj
      "Loaders describe to webpack how to process non-JavaScript modules
      and include these dependencies into your bundles."
    */
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

                https://goo.gl/aAxYAq - `babel-preset-env` documentation.
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
              'transform-object-rest-spread',

              /*
                https://goo.gl/tdqE4q, https://goo.gl/4gJkJh
                Allows us to use arrow functions as methods on classes
                so we don't need to do bindings in the constructor.
              */
              'transform-class-properties'
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
      https://goo.gl/SZjjmC
      Make global variables available to the app.
      This plugin does direct text replacement, so strings
      should be wrapped in JSON.stringify.
    */
    new webpack.DefinePlugin({
      __DEV__: process.env.NODE_ENV === 'development',
      __PROD__: isProd
    }),

    /*
      https://goo.gl/hTXPtE
      Used to destroy & rebuild the dist folder each build.
      Used instead of `CleanWebpackPlugin` - https://goo.gl/PtC14x
    */
    new WebpackCleanupPlugin({
      exclude: ['favicon.ico'] // https://goo.gl/KQxNVb
    }),

    /*
      https://goo.gl/rHd8B2
      Used in conjunction with the SCSS rule above.
      Removes the css data that's in the JS bundle
      and extracts it into a css file.
    */
    new ExtractTextPlugin('styles.[hash].css'),

    /*
      https://goo.gl/hkBPMd
      Removes unused selectors from your CSS.
      This will use the output of the above `ExtractTextPlugin`
      as the asset to purify, searching the files within the paths option.
    */
    isProd && new PurgecssPlugin({
      keyframes: false, // https://goo.gl/bACbDW
      styleExtensions: ['.css'],
      paths: glob.sync([
        // path.resolve(__dirname, 'dist/*.html'),
        // path.resolve(__dirname, 'dist/**/*.css'),
        path.resolve(__dirname, 'src/**/*.js')
      ]),
      /*
        Need to whitelist some 3rd party styles?
        No need to manually construct an array for purgecss-webpack-plugin.
        Let this do it for you! Checkout the docs: https://goo.gl/7B7hbD

        Example:
        whitelister(path.resolve(__dirname, 'node_modules/myModule/styles.css'));
      */
      whitelist: whitelister(),
      extractors: [
        {
          /*
            https://goo.gl/hr6mdb
            This Extractor fixes the issue of classes in JSX:
            <Test className={`one two three`} />
            'one' would not be seen and would otherwise be removed from the CSS.
          */
          extractor: class AvoidBacktickIssue {
            static extract(content) {
              return content.match(/[A-Za-z0-9_-]+/g) || [];
            }
          },
          extensions: ['js'] // file extensions
        }
      ]
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

      Uses uglifyJS v3 to minify JavaScript.
    */
    isProd && new UglifyJsPlugin({
      uglifyOptions: { // https://goo.gl/sShtou, https://goo.gl/3UaFRm
        compress: { // https://goo.gl/Hn5iiE
          passes: 2,
          warnings: true
        },
        mangle: { // https://goo.gl/6Aq8DB
          toplevel: true,
          safari10: true
        },
        toplevel: true // Enables top level var & fxn mangling / dropping unused vars & fxns.
      }
    })
  ].filter(Boolean)
};


const webpackConfig = {
  mode: process.env.NODE_ENV, // https://goo.gl/R88FtY - new in Webpack 4.

  /*
    https://goo.gl/3FP7kM
    The base directory, an absolute path, for resolving
    entry pointsand loaders from configuration.
  */
  context: path.resolve(__dirname, 'src'),

  /*
    https://goo.gl/X8nHJZ
    The point or points to enter the application.
  */
  entry: './entry.js',

  /*
    https://goo.gl/xvjXJd
    The top-level output key contains set of options instructing webpack
    on how and where it should output your bundles, assets and anything else
    you bundle or load with webpack.
  */
  output: {

    /*
      https://goo.gl/DsD2Nn
      This option determines the name of each output bundle.
    */
    filename: '[name].[hash].bundle.js',

    /*
      https://goo.gl/bwR2sW
      The output directory as an absolute path.
    */
    path: path.resolve(__dirname, 'dist'),

    /*
      https://goo.gl/jvYGYt
      The URL of your `output.path` from the view of the HTML page.
      The value of the option is prefixed to every URL created by the runtime or loaders.
    */
    publicPath: '/'
  },

  /*
    https://goo.gl/AENyuH
    These options determine how the different types of modules within a project will be treated.
  */
  module: {

    /*
      An array of Rules which are matched to requests when modules are created.
      These rules can modify how the module is created.
      They can apply loaders to the module, or modify the parser.
    */
    rules: [
      /*
        https://goo.gl/aq8Jce
        A Rule can be separated into three parts — Conditions, Results and nested Rules.

        Conditions (https://goo.gl/9wzXt9)
        ----------
        In a Rule the properties `test`, `include`, `exclude` and `resource` are
        matched with the resource and the property issuer is matched with the issuer.
                         --------                                             ------

        When we import './style.css' within app.js,
        the resource is /path/to/style.css and the issuer is /path/to/app.js.

        Results
        -------
        There are two output values of a Rule:
          1. Applied loaders
            - An array of loaders applied to the resource.
            - Properties: `loader`, `options`, `use`.
            - The `enforce` property affects the loader category. Whether it's a normal, pre- or post- loader.
          2. Parser options
            - An options object which should be used to create the parser for this module.
            - Properties: `parser`.

        Nested Rules
        ------------
        Nested rules can be specified under the properties `rules` and `oneOf`.
        These rules are evaluated when the Rule condition matches.
      */

      /*
        JAVASCRIPT
        ----------
        * ESx => ES5
        * JSX => ES5
      */
      {
        test: /\.js$/,
        exclude: /node_modules/, // This may not be needed since we supplied `include`.
        include: path.resolve(__dirname, 'src'),

        /*
          https://goo.gl/99S6sU
          Loaders will be applied from right to left.
          E.x.: loader3(loader2(loader1(data)))
        */
        use: [
          // https://goo.gl/EXjzoG
          {
            // https://goo.gl/N6uJv3 - Babel loader.
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env', // https://goo.gl/aAxYAq
                '@babel/preset-react' // https://goo.gl/4aEFV3
              ],

              // https://goo.gl/N9gaqc - List of Babel plugins.
              plugins: [
                '@babel/plugin-proposal-object-rest-spread', // https://goo.gl/LCHWnP
                '@babel/plugin-proposal-class-properties' // https://goo.gl/TE6TyG
              ]
            }
          }
        ]
      },

      /*
        SCSS
        ----
        * SCSS => CSS
        * Extract CSS from JS bundle => separate asset
        * Asset => <link> in index.html
      */
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: []
      }
    ]
  }
};
