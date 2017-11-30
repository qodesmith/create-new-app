function dependencies(mongo) {
  const devDependencies = [
    'autoprefixer',
    'babel-core',
    'babel-loader',
    'babel-plugin-transform-object-rest-spread',
    '@babel/preset-env',
    'babel-preset-react',
    'cross-env',
    'css-loader',
    'css-mqpacker',
    'dotenv',
    'extract-text-webpack-plugin',
    'file-loader',
    'glob-all',
    'html-webpack-plugin',
    'node-sass',
    'npm-run-all',
    'postcss-discard-comments',
    'postcss-loader',
    'purify-css',
    'purifycss-webpack',
    'react',
    'react-dom',
    'sass-loader',
    'style-loader',
    'tachyons-sass',
    'uglifyjs-webpack-plugin',
    'webpack',
    'webpack-cleanup-plugin',
    'webpack-dev-middleware',
    'webpack-dev-server'
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
