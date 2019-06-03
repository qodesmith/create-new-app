const browserslistDefault = require('../modules/browserslist')
const dependenciesCreator = require('../modules/dependencies')

function packageJson(answers) {
  const { appName, server, description, author, email, keywords, repository, repo } = answers
  const { devDependencies, serverDependencies } = dependenciesCreator(answers)

  // `--bl` takes precedence over `--browserslist` so long as the later is the default setting.
  const isDefault = answers.browserslist.every((item, i) => item === browserslistDefault[i])
  const browserslist = answers[isDefault ? 'bl' : 'browserslist']

  let packageJson = {
    name: appName,
    version: '0.1.0',
    description,
    keywords,
    author,
    email,
    repository: repository || repo,
    license: 'ISC', // Default `npm init -y` value.
    browserslist // http://bit.ly/2XpC23Q - why you should avoid `last 2 versions`.
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
        'server:dev': 'webpack-dev-server --mode development --env.dev --progress',
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
        start: 'cross-env NODE_ENV=development webpack-dev-server --mode development --env.dev --progress'
      }
    }
  }

  // https://mzl.la/2Xn1ua7
  return JSON.stringify(packageJson, null, 2)
}

module.exports = packageJson
