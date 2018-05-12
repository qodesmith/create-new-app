function packageJson(answers) {
  const {
    mongo,
    redux,
    router,
    appName,
    server,
    description,
    author,
    email,
    keywords = []
  } = answers

  const {
    devDependencies,
    serverDependencies
  } = require('../modules/dependencies')(mongo, redux, router)

  let packageJson = {
    name: appName,
    version: '0.1.0',
    description,
    keywords,
    author,
    email,

    // https://goo.gl/2uAdKL - avoid `last 2 versions`.
    browserslist: ['>0.25%', 'not ie 11', 'not op_mini all']
  }

  if (server) {
    packageJson = {
      ...packageJson,
      main: 'server.js',
      dependencies: serverDependencies,
      devDependencies,
      scripts: {
        build: 'cross-env NODE_ENV=production webpack --mode production --env.prod',
        'build:dev': 'cross-env NODE_ENV=development webpack --mode development --env.dev',
        local: 'npm run server:api',
        'server:dev': 'webpack-dev-server --mode development --env.dev --open --progress',
        'server:api': 'nodemon server.js',
        start: 'cross-env NODE_ENV=development npm-run-all --parallel server:*'
      }
    }
  } else {
    packageJson = {
      ...packageJson,
      devDependencies,
      scripts: {
        build: 'cross-env NODE_ENV=production webpack --mode production --env.prod',
        start: 'cross-env NODE_ENV=development webpack-dev-server --mode development --env.dev --open --progress'
      }
    }
  }

  // https://goo.gl/vldff
  return JSON.stringify(packageJson, null, 2)
}

module.exports = packageJson
