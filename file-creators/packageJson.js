function packageJson(answers) {
  const { appName, server, description, author, email, keywords } = answers;
  const json = [
    '{',
    `  "name": "${appName}",`,
    `  "version": "0.1.0",`,
    `  "description": "${description}",`,
    server && `  "main": "server.js",`,
    `  "scripts": {`,
    `    "build": "cross-env NODE_ENV=production webpack",`,
    server && `    "build:dev": "cross-env NODE_ENV=development webpack",`,
    server && `    "local": "npm run server:api",`,
    server && `    "server:dev": "webpack-dev-server --open",`,
    server && `    "server:api": "nodemon server.js",`,
    server && `    "start": "cross-env NODE_ENV=development npm-run-all --parallel server:*"`,
    !server && `    "start": "cross-env NODE_ENV=development webpack-dev-server --open"`,
    `  },`,
    `  "keywords": [PLACEHOLDER-KEYWORDS],`,
    `  "author": "${author}",`,
    `  "email": "${email}",`,
    `  "license": "MIT",`,
    `  "browserslist": "last 2 versions"`,
    '}',
    ''
  ];

  const kwds = keywords.reduce((acc, kw, i) => {
    return `${acc}\n    "${kw}"${i === keywords.length - 1 ? '\n  ' : ','}`;
  }, '');

  return json
    .filter(Boolean)
    .join('\n')
    .replace('PLACEHOLDER-KEYWORDS', kwds);
}

module.exports = packageJson;
