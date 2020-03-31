#!/usr/bin/env node

// Avoid Node complaining about unhandled rejection errors.
process.on('unhandledRejection', err => console.error(err))

// Node built-in modules.
const path = require('path')

// External modules.
const fs = require('fs-extra')
const validateName = require('validate-npm-package-name')
const chalk = require('chalk')
const cla = require('command-line-args')

// File creators.
const dotEnv = require('./file-creators/dotEnv')
const packageJson = require('./file-creators/packageJson')
const webpackConfig = require('./file-creators/webpackConfig')
const helpersIndex = require('./file-creators/helpersIndex')

// Custom modules.
const run = require('./modules/run')
const isOnline = require('./modules/isOnline')
const { promptYN, promptQ } = require('./modules/prompts')
const safeToCreateDir = require('./modules/safeToCreateDir')
const showVersion = require('./modules/showVersion')
const showHelp = require('./modules/showHelp')
const showMongoHelp = require('./modules/showMongoHelp')
const noName = require('./modules/noName')
const badName = require('./modules/badName')
const portValidator = require('./modules/portValidator')
const adjustPkgJson = require('./modules/adjustPkgJson')
const adjustEntryFile = require('./modules/adjustEntryFile')
const browserslist = require('./modules/browserslist')

// Other.
const cwd = fs.realpathSync(process.cwd()) // http://bit.ly/2YYe9R8 - because symlinks.
const dir = text => path.resolve(__dirname, text)

// Option definitions.
const optionDefinitions = [
  // Main argument.
  // Will be validated in the `parseArgs` fxn by the `validate-npm-package-name` pkg.
  { name: 'appName', type: String, defaultOption: true },

  // Information only.
  { name: 'version', alias: 'v', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'mongoHelp', type: Boolean },
  { name: 'mh', type: Boolean },

  // HTML document title.
  { name: 'title', alias: 't', type: String, defaultValue: '' },

  // Optional addons.
  { name: 'redux', alias: 'x', type: Boolean, defaultValue: false },
  { name: 'router', alias: 'r', type: Boolean, defaultValue: false },

  // Flags.
  { name: 'offline', alias: 'o', type: Boolean, defaultValue: false },
  { name: 'force', alias: 'f', type: Boolean, defaultValue: false }, // Use with caution.
  { name: 'sandbox', alias: 's', type: Boolean, defaultValue: false },

  // `package.json` fields.
  { name: 'author', type: String, defaultValue: '' },
  { name: 'description', type: String, defaultValue: '' },
  { name: 'email', type: String, defaultValue: '' },
  { name: 'keywords', multiple: true, defaultValue: [] },
  { name: 'browserslist', multiple: true, defaultValue: browserslist }, // http://bit.ly/2Z5pejA - why you should avoid `last 2 versions`.
  { name: 'bl', multiple: true, defaultValue: browserslist },
  { name: 'repository', defaultValue: '' },
  { name: 'repo', defaultValue: '' },

  // API / server / devServer options.
  { name: 'devServerPort', type: val => portValidator(val, 8080), defaultValue: 8080 },
  { name: 'apiPort', type: val => portValidator(val, 3000), defaultValue: 3000 },
  { name: 'api', type: String, defaultValue: null }, // No default from the command line, but defaulted in `dotEnv.js`.
  { name: 'express', alias: 'e', type: Boolean },

  // MongoDB options.
  { name: 'mongo', alias: 'm', type: Boolean },
  { name: 'mongoPort', type: Number, defaultValue: 27017 },
  { name: 'mp', type: Number, defaultValue: 27017 },
  { name: 'mongoPortProd', type: Number, defaultValue: 27017 },
  { name: 'mpp', type: Number, defaultValue: 27017 },
  { name: 'mongoUser', type: String, defaultValue: '' },
  { name: 'mu', type: String, defaultValue: '' },
  { name: 'mongoAuthSource', type: String, defaultValue: 'admin' },
  { name: 'mas', type: String, defaultValue: 'admin' },

  // Private options.
  { name: 'noInstall', type: Boolean, defaultValue: false }
]


// Let's go! Push the first dominoe.
letsGo()
async function letsGo() {
  let options = cla(optionDefinitions, { partial: true })
  const { noInstall, appName } = options

  // STEP 1 - check if we're online.
  const online = await isOnline()

  // STEP 2 - decide between a guided process or not.
  // Guided process - called with no arguments.
  if (process.argv.length === 2 || (noInstall && !appName)) {
    // http://bit.ly/2Z7GZ1M - clear the console.
    console.log('\x1Bc')

    options = await guidedProcess({ online, noInstall })

  // CLI process - called with 1 or more arguments.
  } else {
    const parsedArgs = parseArgs(online) // Runs `cla` internally.
    options = processUsersCommand(parsedArgs)
  }

  // STEP 3 - create project directory or sandbox project.
  if (options.sandbox) return createSandbox(options) // Calls `createProjectDirectory`.
  createProjectDirectory(options)

  // STEP 4 - create project files & folders.
  createFiles(options)

  // STEP 5 - install dependecies.
  installDependencies(options)
}


// Analyzes the CLI arguments & returns an object choc full of properties.
function parseArgs(online) {
  // const [nodeLocation, thisFile, ...args] = process.argv
  let options = cla(optionDefinitions, { partial: true })
  const {
    // Info only.
    version,
    help,
    mongoHelp,
    mh,

    // MongoDB.
    mongoUser,
    mu,
    mongoAuthSource,
    mas,

    // App options.
    appName,
    api,
    offline,
    express,
    mongo,
    redux,
    router,
    sandbox
  } = options
  const validation = validateName(appName)


  // Add properties we'll use down the line.
  options = {
    ...options,
    online, // Actual online status.
    redux,
    router,
    offline: !online || offline, // Argument option from the CLI to process *as* offline.
    api: api ? api.replace(/ /g, '') : null,
    server: !!(express || mongo),
    appDir: `${cwd}/${appName}`,
    mongoUser: mongoUser || mu,
    mongoAuthSource: mongoAuthSource || mas
  }

  // `cna -v` or `cna --version`
  if (version) return showVersion() || process.exit()

  // `cna -h` or `cna --help`
  if (help) return showHelp() || process.exit()

  // `cna --mh` or `cna --mongoHelp`
  if (mh || mongoHelp) return showMongoHelp() || process.exit()

  safeToCreateDir(options) || process.exit()

  if (sandbox) return { ...options, sandbox: true }
  if (appName === undefined) return noName() || process.exit()
  if (!validation.validForNewPackages) return badName(appName, validation) || process.exit()
  return options
}

// Creates an object choc full of properties via a series of prompts.
async function guidedProcess({ online, noInstall }) {
  /*
    Questions asked during the guided process:
      1.  App name?
      2.  Include redux?
      3.  Include router?
      4.  Express server?
      5.  MongoDB?
  */

  // Aggregate the default CLI values into an object so we can use those.
  const defaultOptions = optionDefinitions
    .filter(({ defaultValue }) => defaultValue !== undefined)
    .reduce((acc, { name, defaultValue }) => ({ ...acc, [name]: defaultValue }), {})

  const appName = await promptQ('Enter a name for your app:')
  const appDir = `${cwd}/${appName}`

  /*
    This may seem redundant since we check this again later down the line
    but we don't want the user to go through the whole process of answering
    these questions only to be rejected later. Reject as soon as possible.
  */
  safeToCreateDir({ appDir, appName }) || process.exit()
  const validation = validateName(appName)
  if (!validation.validForNewPackages) return badName(appName, validation) || process.exit()

  console.log(`\nPressing \`enter\` defaults to ${chalk.bold('no')} for the following...\n`)
  const redux = await promptYN('Would you like to include Redux?', false)
  const router = await promptYN('Would you like to include React Router?', false)
  const express = await promptYN('Would you like to include an Express server?', false)
  const mongo = express && await promptYN('Would you like to include MongoDB?', false)

  return {
    ...defaultOptions, // Default CLI values.

    // Values from questions.
    appName,
    redux,
    router,
    express,
    mongo,
    online,
    offline: !online,

    // Calculated properties.
    server: express || mongo,
    appDir,

    // Private.
    noInstall
  }
}

// Warns about being offline & adjusts `devServerPort` if there's a conflict with `apiPort`.
function processUsersCommand(options) {
  const {
    online, // Actual online status.
    offline, // CLI argument.
    apiPort,
    express,
    mongo,
    devServerPort,
    sandbox,
    api,
    noInstall
  } = options

  // Not online.
  if (!noInstall && !sandbox && (offline || !online)) {
    !online && console.log(chalk.yellow('You appear to be offline.'))
    console.log(chalk.yellow('Installing via local npm cache.'))
  }

  // The apiPort takes prescedence over the devServerPort.
  if ((express || mongo || api) && devServerPort === apiPort) {
    if (apiPort === 65535) {
      options.devServerPort--
    } else {
      options.devServerPort++
    }
  }

  return options
}

// Simple sandbox projects, executed from `processUsersCommand`.
function createSandbox(options) {
  if (!options.appName) {
    console.log('Oops! You forgot to provide a project name.')
    return console.log(`  ${chalk.green('create-new-app <project-name> --sandbox')}`)
  }

  createProjectDirectory(options)
  fs.copySync(dir('files/sandbox'), options.appDir)
}

// STEP 3
function createProjectDirectory(options) {
  const { appName, appDir, force, sandbox } = options
  const greenDir = chalk.green(`${cwd}/`)
  const boldName = chalk.green.bold(appName)
  const boldSandbox = chalk.bold(' sandbox')

  safeToCreateDir(options) || (!sandbox && force) || process.exit()
  console.log(`\nCreating a new${sandbox ? boldSandbox : ''} app in ${greenDir}${boldName}.`)

  // Create the project directory if it doesn't already exist.
  fs.mkdirpSync(appDir)
}

// STEP 4
function createFiles(options) {
  const { appDir, server, mongo, express, redux, router, title, description } = options
  const filter1 = { filter: file => !file.endsWith('.DS_Store') }

  // `.env`
  fs.writeFileSync(`${appDir}/.env`, dotEnv(options), 'utf8')

  // `.gitignore`
  fs.copySync(dir('files/gitignore.txt'), `${appDir}/.gitignore`)

  // `package.json`
  fs.writeFileSync(`${appDir}/package.json`, packageJson(options), 'utf8')

  // `postcss.config.js`
  fs.copySync(dir('files/postcss.config.js'), `${appDir}/postcss.config.js`)

  // `README.md`
  fs.copySync(dir('files/README.md'), `${appDir}/README.md`)

  // `server.js` (with or without MongoDB options)
  server && fs.copySync(dir(`files/server${mongo ? '-mongo' : ''}.js`), `${appDir}/server.js`)

  // `webpack.config.js`
  fs.writeFileSync(`${appDir}/webpack.config.js`, webpackConfig({ redux, title, description }), 'utf8')

  // `after-compile-plugin.js`
  fs.copySync(dir('files/after-compile-plugin.js'), `${appDir}/after-compile-plugin.js`)

  // `api` directory tree.
  mongo && fs.copySync(dir('./files/api'), `${appDir}/api`, filter1)
  if (express && !mongo) {
    fs.copySync(dir('files/api/home.js'), `${appDir}/api/home.js`)
    fs.copySync(dir('files/api/utilities/errorUtil.js'), `${appDir}/api/utilities/errorUtil.js`)
    fs.copySync(dir('files/api/utilities/catchy.js'), `${appDir}/api/utilities/catchy.js`)
  }

  // `dist` directory tree.
  fs.copySync(dir('./files/dist'), `${appDir}/dist`, filter1)

  // Depending on the options, exclude certain files from being copied.
  const excludedFiles = [
    '.gitkeep',
    router && redux && 'appReducer.js',
    !router && redux && 'homeReducer.js',
    router && 'App.jsx'
  ].filter(Boolean)
  const filter2 = { filter: file => excludedFiles.every(f => !file.includes(f)) }

  // `src` directory tree.
  fs.copySync(dir('./files/src'), `${appDir}/src`, filter2)

  if (router && redux) {
    // Store.
    fs.copySync(dir('files/redux/store-router.js'), `${appDir}/src/store.js`)

    // Redux utilities (actions, helpers, middleware, reducers).
    fs.copySync(dir('files/redux/redux'), `${appDir}/src/redux`, filter2)

    // Entry file.
    fs.copySync(dir('files/redux/entry-router.jsx'), `${appDir}/src/entry.jsx`)

    // Components.
    fs.copySync(dir('files/redux/RouterHome.jsx'), `${appDir}/src/components/Home.jsx`)
    fs.copySync(dir('files/redux/NotFound.jsx'), `${appDir}/src/components/NotFound.jsx`)
  } else if (redux) {
    // Store.
    fs.copySync(dir('files/redux/store.js'), `${appDir}/src/store.js`)

    // Redux utilities (actions, helpers, middleware, reducers).
    fs.copySync(dir('files/redux/redux'), `${appDir}/src/redux`, filter2)

    // Entry file.
    fs.copySync(dir('files/redux/entry.jsx'), `${appDir}/src/entry.jsx`)

    // Components.
    fs.copySync(dir('files/redux/ReduxApp.jsx'), `${appDir}/src/components/App.jsx`)
  } else if (router) {
    // Entry file.
    fs.copySync(dir('files/router/entry.jsx'), `${appDir}/src/entry.jsx`)

    // Components.
    fs.copySync(dir('files/router/Home.jsx'), `${appDir}/src/components/Home.jsx`)
    fs.copySync(dir('files/router/NotFound.jsx'), `${appDir}/src/components/NotFound.jsx`)
  }

  // `/src/helpers/index.js`
  fs.mkdirpSync(`${appDir}/src/helpers`)
  fs.writeFileSync(`${appDir}/src/helpers/index.js`, helpersIndex({ redux }), 'utf8')

  /*
    Add comment to top of `entry.jsx`.
    Locations:
      * ./files/src/entry.jsx
      * ./files/redux/entry.jsx
      * ./files/redux/entry-router.jsx
      * ./files/router/entry.jsx
  */
  const entryFile = fs.readFileSync(`${appDir}/src/entry.jsx`, 'utf8')
  fs.writeFileSync(`${appDir}/src/entry.jsx`, adjustEntryFile(entryFile), 'utf8')
}

// STEP 5
async function installDependencies(options) {
  const { appName, appDir, server, offline, mongo, force, noInstall } = options
  const forceOffline = offline ? ' --offline' : '' // http://bit.ly/2Z2Ht9c
  const cache = offline ? ' cache' : ''

  // Change into the projects directory.
  process.chdir(`${cwd}/${appName}`)

  // Install the dependencies.
  if (!noInstall) {
    offline && console.log(`\nIt looks like you're offline or have a bad connection.`)
    console.log(`Installing project dependencies via npm${cache}...\n`)

    try {
      run(`npm i${forceOffline}`)
    } catch(e) {
      console.log(`\n${chalk.yellow('An error occurred during the npm installation.')}`)

      // Cleanup what was created *only* if we didn't force install.
      if (!force) {
        process.chdir(cwd)
        run(`rm -rf ${cwd}/${appName}`)
        console.log('Created directories and files have been removed.')
        process.exit(1)
      } else {
        console.log('Refusing to remove created directories and files')
        console.log('since they were created in a pre-existing location:')
        console.log(`  ${chalk.cyan(cwd)}`)
      }
    }
  }


  // Adjust the package.json dependencies to show their installed version.
  // E.x. - "react": "^16" => "react": "^16.6.1"
  !noInstall && adjustPkgJson(appDir)

  // Initialize git.
  try {
    run('git init', true) // Don't display stdout.
    console.log('Initialized a git repository.\n')
  } catch (e) {
    console.log(`Tried to initialize a new ${chalk.bold('git')} repository but couldn't.`)
    console.log(`Do you have have ${chalk.bold('git')} installed?\n`)
  }

  noInstall && console.log('No dependecies intalled. `package.json` will not reflect specific versions.')

  // Display the final message.
  const cyanDir = chalk.cyan(appDir)
  const boldName = chalk.bold(appName)
  const serverMsg = server ? 'and Express servers' : 'server'

  console.log(`\nSuccess! Created ${boldName} at ${cyanDir}.`)
  console.log(`Inside that directory you can run several commands:\n`)

  console.log(`  ${chalk.cyan('npm start')}`)
  console.log(`    Starts the development ${serverMsg}.\n`)

  console.log(`  ${chalk.cyan('npm run build')}`)
  console.log(`    Bundles the app into static files for production.\n`)

  if (server) {
    console.log(`  ${chalk.cyan('npm run local')}`)
    console.log(`    Starts only the Express server (no development server).\n`)
  }

  if (mongo) {
    console.log('To see tips & tasks related to MongoDB in production:')
    console.log(`  ${chalk.cyan('cna --mongoHelp')}\n`)
  }

  console.log(`\nGet started by typing:\n`)
  console.log(`  ${chalk.cyan.bold('cd')} ${boldName}`)
  console.log(`  ${chalk.cyan.bold('npm start')}\n`)
}
