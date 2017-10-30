const fs = require('fs');

function copyFileSync(source, target) {
  const file = fs.readFileSync(source, 'utf-8');
  fs.writeFileSync(target, file, 'utf-8');
}

module.exports = copyFileSync;
