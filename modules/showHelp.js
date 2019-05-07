/*
  This module logs help to the screen when running `cna --help`.
*/

const chalk = require('chalk')
const indentFromZero = require('./indentFromZero')


function showHelp() {
  console.log(indentFromZero(`
    Usage: ${chalk.bold('create-new-app')} ${chalk.green('<project-directory>')} [options]


    Options:

      ${chalk.cyan.bold('General options:')}
        -v,  --version    shows the version number
        -h,  --help       shows what you're looking at now
        -mh, --mongoHelp  shows help specific to MongoDB for production
        -o,  --offline    forces the \`npm install\` to use local cache
        -t,  --title      sets the webpage title
        -f,  --force      skips creating a new directory & installs in a pre-existing one

      ${chalk.cyan.bold('App options:')}
        -x,  --redux      includes redux in your application, completely wired up
        -r,  --router     includes React Router in your application, completely wired up

      ${chalk.cyan.bold('package.json field options:')}
        --author          \\
        --description      \\  populates \`package.json\` field names of the same value
        --email            /
        --keywords        /

      ${chalk.cyan.bold('API / server options:')}
        --api             sets the \`devServer.proxy[api]\` key value
        --apiport         sets the \`devServer.proxy[api]\` port value
        -e, --express     sets up an Express api server for Webpack to proxy
        -p, --port        sets the development server port

      ${chalk.cyan.bold('MongoDB options:')}
        -m,    --mongo              sets up an Express api server with MongoDB for Webpack to proxy
        --mp,  --mongoPort          sets the port MongoDB listens on
        --mpp, --mongoPortProd      sets the port MongoDB listens on (for production)
        --mu,  --mongoUser          sets the username for authentication (for production)
        --mas, --mongoAuthSource    sets the collection name that contains the auth user (for production)

      ${chalk.cyan.bold('Creating a sandbox project:')}
        -s, --sandbox     simply creates index.html, styles.css, and main.js files

    Using MongoDB with your app?  View some tips for production with this:
      ${chalk.bold('cna --mongoHelp')}

    Have an issue?  Help keep ${chalk.bold('create-new-app')} awesome by reporting it here:
      ${chalk.cyan('https://github.com/qodesmith/create-new-app/issues/new')}
  `))
}

module.exports = showHelp
