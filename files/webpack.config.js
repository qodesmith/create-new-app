require('dotenv').load() // https://goo.gl/Cj8nKu
const { NODE_ENV, DEV_SERVER_PORT, API, API_PORT } = process.env
const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')


console.log(`

  +-----------------------------------+
  |                                   |
      NODE ENVIRONMENT: ${NODE_ENV}
  |                                   |
  +-----------------------------------+

`)

@@__PLACEHOLDER_WEBPACK_LOG_PORTS__@@


module.exports = (env, argv) => ({
  // https://goo.gl/R88FtY - new in Webpack 4.
  mode: env.prod ? 'production' : 'development',

  /*
    https://goo.gl/3FP7kM
    The base directory, an absolute path, for resolving
    entry points and loaders from configuration.
  */
  context: path.resolve(__dirname, 'src'),

  /*
    https://goo.gl/X8nHJZ
    The point(s) to enter the application.
  */
  entry: [
    path.resolve(__dirname, 'src/entry.js')
  ],

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
      https://goo.gl/d6Wq2G
      Adds helpful info in development when reading the generated code.
    */
    pathinfo: !env.prod,

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
        // sideEffects: false,
        test: /\.(js|jsx)$/,
        include: path.resolve(__dirname, 'src'),

        /*
          https://goo.gl/99S6sU
          Loaders will be applied from right to left.
          E.x.: loader3(loader2(loader1(data)))
        */
        use: [
          // https://goo.gl/EXjzoG
          {
            /*
              https://goo.gl/N6uJv3 - Babel loader.
                - babel-loader@^8.0.0-beta
                - @babel/core
                - @babel/polyfill (used in the entry.js file)
                - @babel/preset-env
                - @babel/preset-react
                - @babel/plugin-proposal-object-rest-spread
                - @babel/plugin-proposal-class-properties
                - @babel/plugin-syntax-dynamic-import
            */
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
                [
                  '@babel/preset-env', // https://goo.gl/aAxYAq
                  {
                    targets: {
                      browsers: [
                        // https://goo.gl/2uAdKL - avoid `last 2 versions`.
                        '>0.25%',
                        'not ie 11',
                        'not op_mini all'
                      ]
                    },
                    modules: false // Needed for tree shaking to work.
                  }
                ],
                '@babel/preset-react' // https://goo.gl/4aEFV3
              ],

              // https://goo.gl/N9gaqc - List of Babel plugins.
              plugins: [
                '@babel/plugin-proposal-object-rest-spread', // https://goo.gl/LCHWnP
                '@babel/plugin-proposal-class-properties', // https://goo.gl/TE6TyG
                '@babel/plugin-syntax-dynamic-import' // https://goo.gl/ho4CDh
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
        test: /\.(scss|css)$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          MiniCssExtractPlugin.loader, // https://goo.gl/uUBr8G
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2
            }
          },
          'postcss-loader', // https://goo.gl/BCwCzg - needs to be *after* `css-loader`.
          {
            loader: 'sass-loader',
            options: {

              /*
                https://goo.gl/hVweJ7
                An array of paths that in which to attempt to resolve your
                @import declarations made in your scss files.
              */
              includePaths: [
                'node_modules/sassyons'
              ],

              /*
                https://goo.gl/xxBHk3
                Values: nested, expanded, compact, compressed
              */
              outputStyle: env.prod ? 'compressed' : 'expanded'
            }
          }
        ]
      },

      /*
        FONTS
        -----
        * Copies fonts found within the `src` tree to the `dist` folder
        * Keeps the original file name
      */
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      },

      /*
        IMAGES
        ------
        * Copies fonts found within the `src` tree to the `dist` folder
        * Keeps the original file name
      */
      {
        test: /\.(png|svg|jpg|gif)$/,
        include: path.resolve(__dirname, 'src/assets'),
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      }
    ]
  },

  // https://goo.gl/NnR9ME
  resolve: {

    /*
      https://goo.gl/7HMoAb
      Create aliases to import certain modules more easily.
      Eliminates having to type out ../../../ all the time.
    */
    alias: @@__PLACEHOLDER_WEBPACK_ALIAS__@@

    /*
      https://goo.gl/57vTmD
      Automatically resolve certain extensions without having to type them out.
    */
    extensions: ['.js', '.jsx', '.json', '.scss']
  },

  // https://goo.gl/bxPV7L
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: { // https://goo.gl/3UaFRm
          ecma: 5,
          output: {
            comments: false // https://goo.gl/wKzHJd
          }
        }
      })
    ]
  },

  // https://goo.gl/aDKWnb
  plugins: [
    /*
      https://goo.gl/SZjjmC
      Make global variables available to the app.
      Needed in order to use the production-ready minified version of React.
    */
    new webpack.DefinePlugin({
      // Convenience variables.
      __DEV__: !env.prod,
      __PROD__: env.prod,

      /*
        https://goo.gl/sB6d6b
        Needed in order to use the production-ready minified version of React.
        Avoids warnings in the console.
      */
      'process.env': {
        NODE_ENV: JSON.stringify(env.prod ? 'production' : 'development')
      }
    }),

    // This must be used in conjunction with the associated scss module rule.
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // Both options are optional.
      filename: '[name].[hash].css',
      chunkFilename: '[id].css'
    }),

    /*
      https://goo.gl/xP7eDB
      A webpack plugin to remove/clean your build folder(s) before building.
    */
    new CleanWebpackPlugin(['dist/*.js', 'dist/*.css'], {
      root: __dirname,
      verbose: true,
      exclude: ['favicon.ico', '.gitignore']
    }),

    /*
      https://goo.gl/pwnnmX, https://goo.gl/og4sNK
      Generates the `index.html` file.
    */
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.ejs'),
      production: !!env.prod,
      title: 'JavaScript === Awesomeness',
      mobileThemeColor: '#000000',
      description: 'Awesome JavaScript project created with Create New App!',
      polyfill: true,
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    })
  ],

  // https://goo.gl/HBnQlq
  devServer: {
    /*
      https://goo.gl/eFdUfe
      Tell the dev server where to serve content from.
      This is only necessary if you want to serve static files.
      Content not served from Webpack's devServer is served from here.
    */
    contentBase: path.resolve(__dirname, 'dist'),

    /*
      https://goo.gl/mgQHiQ
      '...the index.html page will likely have to be served
      in place of any 404 responses.'
    */
    historyApiFallback: true,

    /*
      https://goo.gl/A8ZvxG
      Want to view your site on your phone?
      Make sure your computer and phone are on the same wifi network,
      and navigate to your computer's ip addres: 192.1.2.3:<dev server port>
    */
    host: '0.0.0.0',

    // https://goo.gl/fZ1Hff
    open: true,

    // https://goo.gl/EVMMyC
    port: DEV_SERVER_PORT,

    /*
      https://goo.gl/mrysGp, https://goo.gl/srfqLB
      Nobody wants to see 0.0.0.0 in the browser. This get's rid of that.
    */
    public: `http://localhost:${DEV_SERVER_PORT}`,

    /*
      https://goo.gl/a6WW1p
      Redirect non-static asset calls to the backend API server.
      Unrecognized urls (non-API calls) will be directed to '/'.
      404's will be served `index.html` by `historyApiFallback` above.
    */
    proxy: API ? {
      [API]: {
        target: `http://localhost:${API_PORT}`,
        bypass(req, res, proxyOptions) {
          // Direct all non-get requests to the API server.
          if (req.method.toLowerCase() !== 'get') return

          /*
            Proxy url (browser) requests back to '/'
            and let the front end do all the routing.
            For all others, let the API server respond.
          */

          // Url / browser request - allow front end routing to handle all the things.
          if (req.headers.accept.includes('html')) return '/'

          // Let the API server respond by implicitly returning here.
        }
      }
    } : {}
  },

  /*
    https://goo.gl/K4eZeE
    Seems to be the fastest one with accurate line numbers
    matching what you'd see in your editor.
  */
  devtool: !env.prod && 'cheap-module-eval-source-map',

  /*
    https://goo.gl/ZisDCb
    The externals configuration option provides a way of excluding dependencies
    from the output bundles. Instead, the created bundle relies on that dependency
    to be present in the consumer's environment.

    If you want to load 3rd party libraries via a CDN instead of bundling them,
    include them here in addition to adding `<script>` tags to `index.ejs`.
  */
  // externals: {
  //   react: { root: 'react' },
  //   'react-dom': { root: 'reactDOM' },
  //   // 'react-router-dom': { root: 'ReactRouterDOM' }
  // },

  /*
    https://goo.gl/3mK5hF
    `web` is default, but if you're making a 3rd party library
    consumed in Node, change this to `node`. There are others as well.
  */
  target: 'web'
})
