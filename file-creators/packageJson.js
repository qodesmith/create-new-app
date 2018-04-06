function packageJson(answers) {
  const { appName, server, description, author, email, keywords = [] } = answers;
  const packageJson = {
    name: appName,
    version: '0.1.0',
    description,
    keywords,
    author,
    email
  }

  if (server) {
    packageJson.main = 'server.js'
    packageJson.scripts = {
      build: 'cross-env NODE_ENV=production webpack',
      'build:dev': 'cross-env NODE_ENV=development webpack',
      local: 'npm run server:api',
      'server:dev': 'webpack-dev-server --open',
      'server:api': 'nodemon server.js',
      start: 'cross-env NODE_ENV=development npm-run-all --parallel server:*'
    };
  } else {
    packageJson.scripts = {
      build: 'cross-env NODE_ENV=production webpack',
      start: 'cross-env NODE_ENV=development webpack-dev-server --open'
    };
  }

  // https://goo.gl/vldff
  return JSON.stringify(packageJson, null, 2);
}

module.exports = packageJson;
