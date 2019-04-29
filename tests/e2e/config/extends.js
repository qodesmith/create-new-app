/*
  http://bit.ly/2Whx6xi - extending `expect` for Jest.

  In the end-to-end tests we want to ensure that the correct versions
  of packages were installed. Since we know what major version we're
  trying to install, we need a way to compare the beginning of the packages
  with each other.

  http://bit.ly/2WgsNCy - using the `jest` key in our `package.json` file,
  we point to this file in the `setupFilesAfterEnv` property. Anything added
  to this file will be executed after the test environment has been set up
  but before any of the tests have run.
*/

expect.extend({
  toStartWith(received, expected, meta) {
    const pass = typeof received === 'string' && received.startsWith(expected)
    const extra = meta ? ` (${meta})` : ''

    if (pass) {
      return {
        message: () => `expected ${received} not to start with ${expected}${extra}`,
        pass: true
      }
    }

    return {
      message: () => {
        if (typeof received !== 'string') {
          return `expected a string but received ${received}`
        } else {
          return `expected ${received} to start with ${expected}${extra}`
        }
      },
      pass: false
    }
  }
})
