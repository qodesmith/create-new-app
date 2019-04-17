module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    'react'
  ],
  rules: {
    'no-console': 'warn',
    'no-ex-assign': 'off',
    curly: 'off',
    'default-case': 'error',
    'dot-location': ['error', 'property'],
    'dot-notation': 'off'
  }
}
