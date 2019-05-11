/*
  This module implements the question prompt functionality experienced
  when the user goes through the guided process to generate an app.
  Each question pauses for user input before proceeding to the next.
*/

const readline = require('readline')
const chalk = require('chalk')

// Prompts the user with a yes/no question and stores the answer.
function promptYN(question, deflt) {
  // Create the readline instance that is the basis for our 'prompt'.
  const n = chalk.bold('n')
  const y = chalk.bold('y')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${question} [${deflt ? y : 'y'}, ${deflt === false ? n : 'n'}] `
  })

  return new Promise(resolve => {
    // Trigger the user prompt.
    rl.prompt()

    // Event listener that triggers when the user hit's enter.
    rl.on('line', answer => {
      rl.close()

      switch (answer.trim().toLowerCase()) {
        case 'y':
        case 'yes':
          return resolve(true)
        case 'n':
        case 'no':
          return resolve(false)
        default:
          resolve(deflt === undefined ? promptYN(question) : deflt)
      }
    })
  })
}

// Prompts the user with a question then sanitizes & stores the answer.
function promptQ(data, isBlank) {
  if (typeof data === 'string') data = { question: data }
  const { question, sanitizer } = data

  // Create the readline instance that is the basis for our 'prompt'.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${question} `
  })

  return new Promise(resolve => {
    // Trigger the user prompt.
    rl.prompt()

    // Event listener that triggers when the user hit's enter.
    rl.on('line', answer => {
      rl.close()

      if (sanitizer) answer = sanitizer(answer)
      resolve((answer || !!isBlank) ? (answer || null) : promptQ(data))
    })
  })
}

module.exports = { promptYN, promptQ }
