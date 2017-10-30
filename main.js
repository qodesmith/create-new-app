#!/usr/bin/env node

// Node built-in modules.
const fs = require('fs');
const path = require('path');
// const readline = require('readline');
const { execSync } = require('child_process');

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
const isOnline = require('./modules/isOnline');
const copyTree = require('./modules/copyTree');
// const { yesNo, question } = require('./modules/prompts');
const noName = require('./modules/noName');
const badName = require('./modules/badName');
const portValidator = require('./modules/portValidator');
const titleCase = require('./modules/titleCase');

// Other.
const cwd = process.cwd();
const answers = {};


process.on('unhandledRejection', err => {
  console.log(err);
});


function run(command) {
  execSync(command, { stdio: [0, 1, 2] }); // https://goo.gl/QnaS5C
}

function dir(text) {
  return path.resolve(__dirname, text);
}

// Node < 8 doesn't have `copyFileSync` :/
if (!fs.copyFileSync) fs.copyfileSync = require('./modules/copyFileSync');

/*
  Options
  -------------------

  appName
    * new folder created with this name
    * package.json "name" field
    * converted to title-case for the webapge title (webpack) if `title` not provided
    * mongoURI and mongoSession variables in `.env` use this name (if `mongo` is used)
    * set as a variable in `.env`

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
  { name: 'offline', alias: 'o', type: Boolean },
  { name: 'title', alias: 't', type: String },
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

// STEP 1
isOnline().then(res => ask(res));


// STEP 2
function ask(online) {
  // const [nodeLocation, thisFile, ...args] = process.argv;
  const options = cla(optionDefinitions, {partial: true});
  const {
    appName,
    offline,
    title,
    author,
    description,
    email,
    keywords,
    api,
    apiport,
    express,
    mongo,
    port,
    force
  } = options;
  const validation = validateName(appName);

  if (!appName) return noName();
  if (!validation.validForNewPackages) return badName(appName, validation);
  if (offline || !online) {
    !online && console.log(chalk.yellow('You appear to be offline.'));
    console.log(chalk.yellow('Installing via local npm cache.'));
  }

  // Merge all-the-things into the `answers` object.
  Object.assign(answers, options, {
    api: typeof api === 'string' ? api.replace(/ /g, '') : null,
    offline: !online || !!offline,
    title: title || appName,
    description: description || title || titleCase(appName),
    server: express || mongo,
    appDir: `${cwd}/${appName}`
  });

  // The api port takes prescedence over the dev server port.
  if ((express || mongo) && answers.port === answers.apiport) answers.port++;

  createProjectDirectory();
}

// STEP 3
function createProjectDirectory() {
  const { appName, appDir, force } = answers;

  // Check if the directory already exists.
  const exists = fs.existsSync(appDir);
  if (exists) {
    console.log(`The directory ${chalk.green(appName)} already exists.`);

    if (force) {
      console.log('Force installing in pre-existing directory...');
    } else {
      return console.log('Try a different name.');
    }
  }

  const greenDir = chalk.green(`${cwd}/`);
  const boldName = chalk.green.bold(appName);
  console.log(`Creating a new app in ${greenDir}${boldName}.`);

  // Create the project directory.
  !force && fs.mkdirSync(appDir);
  createFiles();
}

// STEP 4
function createFiles() {
  const { appDir, server, mongo } = answers;

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
