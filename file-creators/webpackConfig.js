const fs = require('fs');
const path = require('path');

function webpackConfig(answers) {
  const { server, port, apiport, api, title, description } = answers;
  const filePath = path.resolve(__dirname, '../files/webpack.config.js');
  const file = fs.readFileSync(filePath, 'utf-8')
    .toString()
    .replace('PLACEHOLDER-API', api)
    .replace('PLACEHOLDER-PORT', port)
    .replace('PLACEHOLDER-APIPORT', apiport)
    .replace('PLACEHOLDER-TITLE', title)
    .replace('PLACEHOLDER-DESCRIPTION', description)
    .split('\n');

  /*
    Remove all api-server related things.
    server - use local Express server
    api - remote server, no local Express server
  */
  if (!server && typeof api !== 'string') {
    // Contents of the line we're looking for.
    const proxy = 'proxy: {';

    // The start of the portion of the array we want to splice out.
    const proxyStart = file.findIndex(line => line.includes(proxy));

    // How many preceding spaces.
    const proxyIndent = file[proxyStart].search(/\S/); // https://goo.gl/DirJ71

    // New array with proxy as the 1st line.
    const proxyArr = file.slice(proxyStart);

    // What our desired end line should look like.
    const endLine = ' '.repeat(proxyIndent) + '}';

    // The end of the portion of the array we want to splice out.
    const proxyEnd = proxyArr.findIndex(line => line.includes(endLine)) + proxyStart;

    // Remove the proxy portion of the array.
    file.splice(proxyStart, proxyEnd - proxyStart + 1);

    // With no server, remove the slash which allows
    // opening the generated html file in the browser directly.
    return file.join('\n').replace(`publicPath: '/'`, `publicPath: ''`);
  }

  return file.join('\n');
}

module.exports = webpackConfig;
