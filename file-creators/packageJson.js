function packageJson(answers) {
  const { appName, server, description, author, email, keywords } = answers;
  const phRemove = 'PLACEHOLDER-REMOVE';
  const phKeywords = 'PLACEHOLDER-KEYWORDS';
  const json = `
    {
      "name": "${appName}",
      "version": "0.1.0",
      "description": "${description}",
      ${server ? `"main": "server.js",` : phRemove}
      "scripts": {
        "build": "cross-env NODE_ENV=production webpack",
        ${server ? `"build:dev": "cross-env NODE_ENV=development webpack",` : phRemove}
        ${server ? `"local": "npm run server:api",` : phRemove}
        ${server ? `"server:dev": "webpack-dev-server --open",` : phRemove}
        ${server ? `"server:api": "nodemon server.js",` : phRemove}
        ${server ? `"start": "cross-env NODE_ENV=development npm-run-all --parallel server:*"` : phRemove}
        ${!server ? `"start": "cross-env NODE_ENV=development webpack-dev-server --open"` : phRemove}
      },
      "keywords": ${phKeywords},
      "author": "${author}",
      "email": "${email}",
      "license": "MIT",
      "browserslist": "last 2 versions"
    }
  `.split('\n').slice(1);

  // Do a bunch of leading-space calculation stuffs.
  // We want the final `package.json` file to look good.
  const indent = json[0].search(/\S/); // https://goo.gl/DirJ71
  const kwIndex = json.findIndex(line => line.includes(phKeywords));
  const kwIndent = json[kwIndex].search(/\S/) + 2;
  const kwSpaces = ' '.repeat(kwIndent);
  const lastSpaces = ' '.repeat(kwIndent - 2);
  const lastIndex = keywords.length - 1;
  const kwds = keywords.reduce((acc, kw, i) => {
    return `${acc}\n${kwSpaces}"${kw}"${i === lastIndex ? '' : ','}`;
  }, '');
  const kwdsArr = keywords.length ? `[${kwds}\n${lastSpaces}]` : '[]';

  // Resolve the keywords array.
  json[kwIndex] = json[kwIndex].replace(phKeywords, kwdsArr);

  return json
    .filter(line => line.trim() !== phRemove)
    .join('\n')  //  \  These two lines are needed to avoid weird issues
    .split('\n') //  /  with the newline characters in `kwds`.
    .map(line => line.slice(indent))
    .join('\n');
}

module.exports = packageJson;
