const readline = require('readline');

// Prompts the user with a yes/no question and stores the answer.
function promptYN(question) {
  // Create the readline instance that is the basis for our 'prompt'.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n${question} [y, n] `
  });

  return new Promise(resolve => {
    // Trigger the user prompt.
    rl.prompt();

    // Event listener that triggers when the user hit's enter.
    rl.on('line', answer => {
      rl.close();
      answer = answer.trim().toLowerCase();

      switch (answer) {
        case 'y':
        case 'yes':
          return resolve(true);
        case 'n':
        case 'no':
          return resolve(false);
        default:
          resolve(promptYN(question));
      }
    })
  });
}

// Prompts the user with a question then sanitizes & stores the answer.
function promptQ(data) {
  if (typeof data === 'string') data = { question: data };
  const { question, sanitizer, blank } = data;

  // Create the readline instance that is the basis for our 'prompt'.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n${question} `
  });

  return new Promise(resolve => {
    // Trigger the user prompt.
    rl.prompt();

    // Event listener that triggers when the user hit's enter.
    rl.on('line', answer => {
      rl.close();

      if (sanitizer) answer = sanitizer(answer);
      resolve((answer || blank) ? (answer || null) : promptQ(data));
    });
  });
}

module.exports = {
  promptYN,
  promptQ
};
