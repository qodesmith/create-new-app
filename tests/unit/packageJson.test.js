const packageJson = require('../../file-creators/packageJson')
const json = {
  name: 'test',
  version: '0.1.0',
  description: 'original description',
  keywords: ['one', 'two', 'three'],
  author: 'Qodesmith',
  email: 'yomama@sofat.com',
  repository: {
    type: 'git',
    url: 'https://github.com/qodesmith/create-new-app'
  },
  license: 'ISC',
  browserslist: [
    '>0.25%',
    'not ie 11',
    'not op_mini all'
  ],
  main: 'server.js',
  dependencies: {
    'body-parser': '^1.19.0',
    chalk: '^3.0.0',
    compression: '^1.7.4',
    'connect-mongo': '^3.2.0',
    dotenv: '^8.2.0',
    express: '^4.17.1',
    'express-session': '^1.17.1',
    helmet: '^3.23.3',
    mongodb: '^3.6.2',
    nodemon: '^2.0.6',
    saslprep: '^1.0.3'
  },
  devDependencies: {
    '@babel/core': '^7.12.3',
    '@babel/plugin-proposal-class-properties': '^7.12.1',
    '@babel/plugin-proposal-nullish-coalescing-operator': '^7.12.1',
    '@babel/plugin-proposal-object-rest-spread': '^7.12.1',
    '@babel/plugin-proposal-optional-chaining': '^7.12.1',
    '@babel/plugin-syntax-dynamic-import': '^7.8.3',
    '@babel/preset-env': '^7.12.1',
    '@babel/preset-react': '^7.12.1',
    '@fullhuman/postcss-purgecss': '^2.3.0',
    autoprefixer: '^9.8.6',
    'babel-loader': '^8.1.0',
    'clean-webpack-plugin': '^3.0.0',
    'core-js': '^3.6.5',
    'cross-env': '^7.0.2',
    'css-declaration-sorter': '^5.1.2',
    'css-loader': '^3.6.0',
    cssnano: '^4.1.10',
    'fast-css-loader': '^1.0.2',
    'fast-sass-loader': '^1.5.0',
    'file-loader': '^6.1.1',
    'glob-all': '^3.2.1',
    history: '^4.10.1',
    'html-webpack-plugin': '^4.5.0',
    'mini-css-extract-plugin': '^0.12.0',
    'node-sass': '^4.14.1',
    'npm-run-all': '^4.1.5',
    postcss: '^7.0.35',
    'postcss-combine-duplicated-selectors': '^8.1.0',
    'postcss-combine-media-query': '^1.0.1',
    'postcss-loader': '^3.0.0',
    'purgecss-whitelister': '^2.4.0',
    react: '^16.14.0',
    'react-dom': '^16.14.0',
    'react-redux': '^7.2.1',
    'react-router-dom': '^5.2.0',
    redux: '^4.0.5',
    'regenerator-runtime': '^0.13.7',
    'sass-loader': '^8.0.2',
    sassyons: '^3.3.0',
    'terser-webpack-plugin': '^2.3.8',
    webpack: '^4.44.2',
    'webpack-cli': '^3.3.12',
    'webpack-dev-server': '^3.11.0'
  },
  scripts: {
    build: 'cross-env NODE_ENV=production webpack --mode production --env prod',
    'build:dev': 'cross-env NODE_ENV=development webpack --mode development --env dev',
    local: 'npm run server:api',
    'server:dev': 'webpack serve --mode development --progress --env dev',
    'server:api': 'nodemon server.js',
    start: 'cross-env NODE_ENV=development npm-run-all --parallel server:*'
  }
}

describe('packageJson', () => {
  it('should create contents for the "package.json" file', () => {
    const optionsNoServer = {
      appName: 'packageJson-test',
      browserslist: ['ie > 10', 'last 2 versions'],
      description: 'this is a test',
      author: 'Qodesmith',
      email: 'yomama@sofat',
      keywords: ['zinc', 'alpha', 'qodesmith'],
      version: '32.1.88',
      license: 'to-kill',
      repository: {
        type: 'git',
        url: 'https://github.com/qodesmith/create-new-app'
      },
    }
    // const { appName, server, description, author, email, keywords, repository, repo } = options
    const results = packageJson({ options: optionsNoServer, destinationPath: null })

    const resultsObj = JSON.parse(results)

    // console.log(resultsObj)

    expect(resultsObj.name).toEqual(optionsNoServer.appName)
    expect(resultsObj.version).toEqual(optionsNoServer.version)
    expect(resultsObj.description).toEqual(optionsNoServer.description)
    expect(resultsObj.keywords).toEqual(optionsNoServer.keywords.sort())
    expect(resultsObj.author).toEqual(optionsNoServer.author)
    expect(resultsObj.email).toEqual(optionsNoServer.email)
    expect(resultsObj.repository).toEqual(optionsNoServer.repository)
    expect(resultsObj.license).toEqual(optionsNoServer.license)
    expect(resultsObj.browserslist).toEqual(optionsNoServer.browserslist)
    expect(resultsObj).toHaveProperty('devDependencies')
    expect(resultsObj).toHaveProperty('scripts')
  })
})
