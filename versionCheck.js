const nodeVersion = process.versions.node;

if (nodeVersion[0] < 6) {
  const msg1 = 'Create New App requires Node >= 6 and npm >= 3.';
  const msg2 = 'Please upgrade. The easiest way is to use Node Version Manager:';
  const msg3 = '  https://github.com/creationix/nvm';

  console.log(msg1);
  console.log(msg2);
  console.log(msg3);

  process.exit(1);
}
