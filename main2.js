#!/usr/bin/env node

import {Command} from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import path from 'path'
import validateName from 'validate-npm-package-name'
import badName from './modules_NEW/badName.js'

// How we import JSON files in an ESM world.
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

letsGo()
async function letsGo() {
  const appName = await initProgram()

  if (appName === undefined || !appName.trim()) {
    // Start CLI prompts.
    startPrompts()
  } else {
    // Start app creation based off of options.
    createApp({appName})
  }
}

/**
 * Initiate the CLI program with options.
 */
async function initProgram() {
  return new Promise(resolve => {
    const program = new Command()
    program
      .name('cna')
      .description(getAppHelpDescription())
      .version(
        packageJson.version,
        '-v, --version',
        'The current version of Create New App.'
      )

      /**
       * Optionally declare the name of the app on the CLI. If left out, the user
       * will be promted to enter the name of their app.
       */
      .argument('[appName]')
      .action(resolve)
      .parse()
  })
}

/**
 * Start the guided process. If a user hasn't entered an app name at the command
 * prompt they will be brought to the guided process.
 */
function startPrompts() {
  inquirer
    .prompt([
      // App name.
      {
        type: 'input',
        message: "What's the name of your app?",
        name: 'appName',
        validate(appName) {
          const validation = validateName(appName)

          if (!validation.validForNewPackages) {
            return badName(appName, validation)
          }

          return true
        },
      },

      // Fullstack options.
      {
        type: 'checkbox',
        message: 'Would you like any fullstack options?',
        name: 'fullstackOptions',
        choices: [
          {name: 'React Router', value: 'reactRouter'},
          {name: 'Express Node Server', value: 'express'},
          {name: 'MongoDB (will install Express)', value: 'mongo'},
        ],
      },
    ])
    .then(({appName, fullstackOptions}) => {
      const reactRouter = fullstackOptions.includes('reactRouter')
      const mongo = fullstackOptions.includes('mongo')
      const express = mongo || fullstackOptions.includes('express')

      createApp({appName, reactRouter, express, mongo})
    })
}

function createApp({appName, reactRouter, express, mongo}) {
  const cwd = process.cwd()

  console.log({appName, reactRouter, express, mongo})
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function getAppHelpDescription() {
  return [
    chalk.bold('Create full stack React Applications!'),
    [
      `${chalk.green('M')} - ${chalk.italic('MongoDB')}`,
      `${chalk.green('E')} - ${chalk.italic('Express')}`,
      `${chalk.green('R')} - ${chalk.italic('React')}`,
      `${chalk.green('N')} - ${chalk.italic('Node')}`,
    ].join(' • '),
  ].join('\n')
}
