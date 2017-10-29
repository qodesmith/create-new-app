const { mkdirSync, copyFileSync, statSync, readdirSync } = require('fs');
const ignores = ['.DS_Store'];

// Copies the entire contents of one tree to a given destination.
function copyTree(sourceFolder, destination) {
  const sourceFolderName = sourceFolder.split('/').pop();
  const targetFolder = `${destination}/${sourceFolderName}`;
  const files = [];
  const folders = [];

  // 1. Create the new target folder.
  mkdirSync(targetFolder);

  // 2. Create two lists: files & folders.
  readdirSync(sourceFolder).forEach(item => {
    if (ignores.includes(item)) return;

    const stat = statSync(`${sourceFolder}/${item}`);

    if (stat.isFile()) files.push(item);
    if (stat.isDirectory()) folders.push(item);
  });

  // 3. Iterate through files and copy them to the new target folder.
  files.forEach(file => copyFileSync(`${sourceFolder}/${file}`, `${targetFolder}/${file}`));

  // 4. Iterate through folders and create them in the new target folder,
  //    then recursively call `copyTree` for each of those folders.
  folders.forEach(folder => copyTree(`${sourceFolder}/${folder}`, `${targetFolder}`));
}

module.exports = copyTree;
