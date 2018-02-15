#!/usr/bin/env node

// Node built-in modules.
const fs = require('fs-extra');
const path = require('path');
// const readline = require('readline');

// External modules.
const validateName = require('validate-npm-package-name');
const chalk = require('chalk');
const cla = require('command-line-args');

// File creators.
const dotEnv = require('./file-creators/dotEnv');
const gitIgnore = require('./file-creators/gitIgnore');
const packageJson = require('./file-creators/packageJson');
const webpackConfig = require('./file-creators/webpackConfig.js');

// Custom modules.
const run = require('./modules/run');
const isOnline = require('./modules/isOnline');
const copyTree = require('./modules/copyTree');
const { promptYN, promptQ } = require('./modules/prompts');
const checkDirExists = require('./modules/checkDirExists');
const showVersion = require('./modules/showVersion');
const showHelp = require('./modules/showHelp');
const noName = require('./modules/noName');
const badName = require('./modules/badName');
const portValidator = require('./modules/portValidator');
const titleCase = require('./modules/titleCase');

// Other.
const cwd = process.cwd();

process.on('unhandledRejection', err => {
  // console.log(err);
});

function dir(text) {
  return path.resolve(__dirname, text);
}

// Node < 8 doesn't have `copyFileSync` :/
if (!fs.copyFileSync) fs.copyFileSync = require('./modules/copyFileSync');

/*
  Options
  -------------------

  appName
    * new folder created with this name
    * package.json "name" field
    * converted to title-case for the webapge title (webpack) if `title` not provided
    * mongoURI and mongoSession variables in `.env` use this name (if `mongo` is used)
    * set as a variable in `.env`

  version
    * displays the current version of this package
    * ignores any other CLI arguments and only displays the version number

  offline
    * forces the `npm install` to use local cache

  title
    * sets the webpage title generated by Webpack's `HtmlWebpackPlugin`
    * defaults to the value of `appName`

  force
    * skips creating a directory for the app
    * used for installing in a pre-existing directory
    * use with caution

  author, description, email, keywords
    * populates package.json field names of the same value
    * description defaults to `title` or a title-cased version of `appName`

  api
    * sets the `devServer.proxy[api]` key value
    * defaults to '/api'

  apiport
    * sets the `devServer.proxy[api]` port value
    * triggers the use of the `api` default value
    * defaults to 8080
    * set as the PORT variable in the `.env` file

  express
    * creates `server.js` and the `api` folder WITHOUT a `utilities` sub-folder

  mongo
    * creates `server.js` and the `api` folder WITH a `utilities` sub-folder
    * sets up MongoDB

  port
    * sets the `devServer.port` value
    * defaults to 3000
*/

const optionDefinitions = [
  { name: 'appName', type: String, defaultOption: true },
  { name: 'version', alias: 'v', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'offline', alias: 'o', type: Boolean },
  { name: 'title', alias: 't', type: String },
  { name: 'redux', alias: 'r', type: Boolean},
  { name: 'force', alias: 'f', type: Boolean }, // Use with caution.

  // `package.json` fields.
  { name: 'author', type: String, defaultValue: '' },
  { name: 'description', type: String },
  { name: 'email', type: String, defaultValue: '' },
  { name: 'keywords', type: String, multiple: true, defaultValue: [] },

  // API / server options.
  { name: 'api', type: String },
  { name: 'apiport', type: val => portValidator(val, 'api'), defaultValue: 8080 },
  { name: 'express', alias: 'e', type: Boolean },
  { name: 'mongo', alias: 'm', type: Boolean },
  { name: 'port', alias: 'p', type: val => portValidator(val, 'dev'), defaultValue: 3000 }
];

// Let's go! Push the first dominoe.
(async function letsGo(argz) {
  // STEP 1 - check if we're online.
  const online = await isOnline();

  // STEP 2 - decide between a guided process or not.
  let options;
  if (argz.length === 2) {
    options = await guidedProcess(online);
  } else {
    options = processUsersCommand(parseArgs(online))
  }
  const options = await (argz.length === 2 ? guidedProcess : processUsersCommand)(parseArgs(online));

  // STEP 3 - create project directory.
  return createProjectDirectory(options);

  // STEP 4 - create project files & folders.
  createFiles(options);
})(process.argv);

// Analyzes the CLI arguments & returns an object choc full of properties.
function parseArgs(online) {
  // const [nodeLocation, thisFile, ...args] = process.argv;
  const options = cla(optionDefinitions, { partial: true });
  const { appName, api, offline, title, description, express, mongo } = options;
  const validation = validateName(appName);

  // Add properties we'll use down the line.
  Object.assign(options, {
    online, // Actual online status.
    offline: !online || !!offline, // Argument option from the CLI.
    api: api ? api.replace(/ /g, '') : null,
    title: title || appName,
    description: description || title || titleCase(appName),
    server: express || mongo,
    appDir: `${cwd}/${appName}`
  });

  /*
    2 no name scenarios:
      1. User simply typed `cna` => trigger the guided process (in `letsGo` above).
      2. User typed `cna --some --options` => should display the how-to message.
  */

  if (!appName) noName() && process.exit();
  if (!validation.validForNewPackages) badName(appName, validation) && process.exit();
  return options;
}

// Creates an object choc full of properties via a series of prompts.
function guidedProcess(options) {
  // App name.
  const appName = await promptQ('Enter a name for your app:');
  checkDirExists(options);

  // Mongo + Express.
  const mongoQuestion = [
    'Including MongoDB will also come with an Express server.',
    'You can answer no for this and still include an Express server later.',
    chalk.bold('Would you like to include MongoDB and Express?')
  ].join('\n');
  const mongo = await promptYN(mongoQuestion);

  // Express only.
  let express = mongo;
  if (!mongo) express = await promptYN(chalk.bold('Would you like an Express server?'));

  // Api flag.
  let api = null;
  if (mongo || express) {
    api = await promptQ({
      question: chalk.bold('Enter your local api route (default = /api):'),
      blank: true
    }) || '/api';
  }

  // Api proxy port.
  const apiProxyPort = await promptQ({
    question: chalk.bold('Enter a proxy port for your api (default = 8080):'),
    sanitizer: val => (Number.isInteger(+num) && +num > 0 ? +num : 8080)
  });

  // Dev server port.
  const devServerPort = await promptQ({
    question: chalk.bold('Enter a development server port (default = 3000):')
    sanitizer: val => (Number.isInteger(+num) && +num > 0 ? +num : 3000)
  });

  // Author, email, description, keyowrds.
  let author, email, description, keywords;
  const userQuestion = [
    'At this time would you like to enter the following info:'
    'author, email, description, keywords?'
  ].join('\n');
  const userInfo = await promptYN(userQuestion);
  if (userInfo) {
    author = await promptQ(chalk.bold('Author:'), true) || '';
    email = await promptQ(chalk.bold('Email:'), true) || '';
    description = await promptQ(chalk.bold('Description:'), true) || '';
    keywords = await promptQ({
      question: chalk.bold('Keywords (separate by space):'),
      sanitizer: values => values ? values.split(' ') : []
    });
  }

  return {
    ...options,
    appName,
    mongo,
    express,
    api,
    apiport: apiProxyPort,
    port: devServerPort,
    author,
    email,
    description,
    keywords
  };
}

// Processes --version and --help commands (among other things).
function processUsersCommand(options) {
  const {
    appName,
    version,
    help,
    online, // Actual online status.
    offline, // CLI argument.
    title,
    description,
    api,
    apiport,
    express,
    mongo,
    port
  } = options;

  // `cna -v` or `cna --version`
  if (version) return showVersion();

  // `cna -h` or `cna --help`
  if (help) return showHelp();

  // Not online.
  if (offline || !online) {
    !online && console.log(chalk.yellow('You appear to be offline.'));
    console.log(chalk.yellow('Installing via local npm cache.'));
  }

  // The api port takes prescedence over the dev server port.
  if ((express || mongo) && port === apiport) options.port++;

  return options;
}

// STEP 3
function createProjectDirectory(options) {
  const { appName, appDir, force } = options;

  // Check if the directory already exists.
  const exists = fs.existsSync(appDir);
  if (exists) {
    console.log(`The directory ${chalk.green(appName)} already exists.`);

    if (force) {
      console.log('Force installing in pre-existing directory...');
    } else {
      console.log('Try a different name.') && process.exit();
    }
  }

  const greenDir = chalk.green(`${cwd}/`);
  const boldName = chalk.green.bold(appName);
  console.log(`Creating a new app in ${greenDir}${boldName}.`);

  // Create the project directory.
  !force && fs.mkdirSync(appDir);
}

// STEP 4
function createFiles() {
  const { appDir, server, mongo, express } = answers;

  // `.env`
  fs.writeFileSync(`${appDir}/.env`, dotEnv(answers), 'utf-8');

  // `.gitignore`
  fs.writeFileSync(`${appDir}/.gitignore`, gitIgnore(), 'utf-8');

  // `package.json`
  fs.writeFileSync(`${appDir}/package.json`, packageJson(answers), 'utf-8');

  // `postcss.config.js`
  fs.copyFileSync(dir('files/postcss.config.js'), `${appDir}/postcss.config.js`);

  // `README.md`
  fs.copyFileSync(dir('files/README.md'), `${appDir}/README.md`);

  // `server.js` (with or without MongoDB options)
  server && fs.copyFileSync(dir(`files/server${mongo ? '-mongo' : ''}.js`), `${appDir}/server.js`);

  // `webpack.config.js`
  fs.writeFileSync(`${appDir}/webpack.config.js`, webpackConfig(answers), 'utf-8');

  // `api` directory tree.
  mongo && copyTree(dir('./files/api'), appDir);
  if (express && !mongo) {
    const apiDir = `${appDir}/api`;
    fs.mkdirSync(apiDir);
    fs.copyFileSync(dir('files/express-home-route.js'), `${apiDir}/home.js`);
  }

  // `dist` directory tree.
  copyTree(dir('./files/dist'), appDir);

  // `src` directory tree.
  copyTree(dir('./files/src'), appDir);

  installDependencies();
}

// STEP 5
function installDependencies() {
  const { appName, appDir, mongo, server, offline } = answers;
  const forceOffline = offline ? '--offline' : ''; // https://goo.gl/aZLDLk
  const cache = offline ? ' cache' : '';
  const {
    devDependencies,
    serverDependencies,
    dependencies
  } = require('./modules/dependencies')(mongo);

  // Change into the projects directory.
  process.chdir(`${cwd}/${appName}`);

  // Install the devDependencies.
  console.log(`\nInstalling \`devDependencies\` via npm${cache}. This may take a bit...`);
  const devs = devDependencies.concat(server ? serverDependencies : []);
  run(`npm ${forceOffline} i -D ${devs.join(' ')}`);

  // Install the dependencies.
  if (server) {
    console.log(`\nInstalling \`dependencies\` via npm${cache}. Again, this may take a bit...`);
    run(`npm ${forceOffline} i ${dependencies.join(' ')}`);
  }

  const cyanDir = chalk.cyan(appDir);
  const boldName = chalk.bold(appName);
  const serverMsg = server ? 'and Express servers' : 'server';

  console.log(`\nSuccess! Created ${boldName} at ${cyanDir}.`);
  console.log(`Inside that directory you can run several commands:\n`);

  console.log(`  ${chalk.cyan('npm start')}`);
  console.log(`    Starts the development ${serverMsg}.\n`);

  console.log(`  ${chalk.cyan('npm run build')}`);
  console.log(`    Bundles the app into static files for production.\n`);

  if (server) {
    console.log(`  ${chalk.cyan('npm run local')}`);
    console.log(`    Starts the Express server (no development server).\n`);
  }

  console.log(`\nGet started by typing:\n`);
  console.log(`  ${chalk.cyan('cd')} ${appName}`)
  console.log(`  ${chalk.cyan('npm start')}\n`);

  console.log('JavaScript rules!');
}
