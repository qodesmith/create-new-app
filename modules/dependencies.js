function dependencies(mongo) {
  const devDependencies = [
    'autoprefixer',

    // BABEL THINGS
    // https://goo.gl/ESXgmh
    'babel-loader@8.0.0-beta.0',
    '@babel/core',
    '@babel/preset-env',
    '@babel/preset-react'
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',


    // WEBPACK CORE THINGS
    'webpack',
    'webpack-cli',
    'webpack-dev-middleware',
    'webpack-dev-server',

    // WEBPACK OTHER THINGS
    'webpack-cleanup-plugin',
    'uglifyjs-webpack-plugin',
    'sass-loader',
    'style-loader',
    'extract-text-webpack-plugin',
    'html-webpack-plugin',
    'file-loader',




    'cross-env',
    'css-loader',
    'css-mqpacker',
    'dotenv',
    'glob-all',
    'node-sass',
    'npm-run-all',
    'postcss-discard-comments',
    'postcss-loader',
    'purgecss-webpack-plugin',
    'purgecss-whitelister',
    'react',
    'react-dom',
    'tachyons-sass',
  ];

  const serverDependencies = [
    'nodemon'
  ];

  const dependencies = [
    'body-parser',
    'catchify',
    'compression',
    mongo && 'connect-mongodb-session',
    'dotenv',
    'express',
    mongo && 'express-session',
    'helmet',
    mongo && 'mongodb'
  ].filter(Boolean);

  return {
    devDependencies,
    serverDependencies,
    dependencies
  };
}

module.exports = dependencies;
