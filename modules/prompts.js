const readline = require('readline');

// Prompts the user with a yes/no question and stores the answer.
function yesNo(answers, q, key) {
  // Create the readline instance that is the basis for our 'prompt'.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${q} [y, n] `
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
          answers[key] = true;
          break;
        case 'n':
        case 'no':
          answers[key] = false;
          break;
        default:
          return resolve(yesNo(answers, q, key));
      }

      resolve();
    });
  });
}

// Prompts the user with a question then sanitizes & stores the answer.
function question(answers, options) {
  const { q, key, sanitizer, blank } = options;

  // Create the readline instance that is the basis for our 'prompt'.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${q} `
  });

  return new Promise(resolve => {
    // Trigger the user prompt.
    rl.prompt();

    // Event listener that triggers when the user hit's enter.
    rl.on('line', answer => {
      let original;
      rl.close();

      if (sanitizer) {
        original = answer;
        answer = sanitizer(answer);
      }

      if (answer || blank) {
        answers[key] = answer || '';
        if (sanitizer) answers[`${key}Original`] = original;
        resolve();
      } else {
        resolve(question(answers, options));
      }
    });
  });
}

module.exports = {
  yesNo,
  question
};
