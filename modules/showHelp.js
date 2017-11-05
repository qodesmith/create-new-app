const chalk = require('chalk');

function showHelp() {
  console.log(`
    Usage: ${chalk.bold('create-new-app')} ${chalk.green('<project-directory>')} [options]


    Options:

      ${chalk.cyan.bold('General options:')}
        -v, --version     shows the version number
        -h, --help        shows what you're looking at now
        -o, --offline     forces the \`npm install\` to use local cache
        -t, --title       sets the webpage title
        -f, --force       skips creating a new directory & installs in a pre-existing one

      ${chalk.cyan.bold('package.json field options:')}
        --author          \\
        --description      \\  populates \`package.json\` field names of the same value
        --email            /
        --keywords        /

      ${chalk.cyan.bold('API / server options:')}
        --api             sets the \`devServer.proxy[api]\` key value
        --apiport         sets the \`devServer.proxy[api]\` port value
        -e, --express     sets up an Express api server for Webpack to proxy
        -m, --mongo       sets up an Express api server with MongoDB for Webpack to proxy
        -p, --port        sets the development server port

    Have an issue?  Help keep ${chalk.bold('create-new-app')} awesome by reporting it here:
      ${chalk.cyan('https://github.com/qodesmith/create-new-app/issues/new')}
  `);
}

module.exports = showHelp;
