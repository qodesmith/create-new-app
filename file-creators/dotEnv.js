// https://goo.gl/MrXVRS - micro UUID!
const uuid = a=>a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);

function dotEnv(options) {
  const { appName, devServerPort, api, apiPort, mongo, server, title, description } = options;
  const warning = [
    '# THIS FILE WILL BE GIT IGNORED.',
    '# IT IS HIGHLY RECOMMENDED THAT YOU DO NOT COMMIT THIS FILE INTO VERSION CONTROL.',
    '# PLEASE KEEP ANY SENSITIVE DATA OUT OF VERSION CONTROL.\n\n'
  ];
  const contents = [
    `appName=${appName}`,
    title && `title=${title}`,
    description && `description='${description}'`,
    `DEV_SERVER_PORT=${devServerPort}\n`
  ].filter(Boolean);

  if (!server) return [...warning, ...contents].join('\n');

  return [
    ...warning,
    mongo && `mongoURI=mongodb://localhost:27017/${appName}`,
    mongo && `mongoSession=${appName}Sessions`,
    mongo && `secret=${uuid()}`,
    api && `API=${api}`,
    `API_PORT=${apiPort}`,
    ...contents
  ].filter(Boolean).join('\n');
}

module.exports = dotEnv;
