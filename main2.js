#!/usr/bin/env node

import {Command} from 'commander'
import chalk from 'chalk'
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

const program = new Command()

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

program.parse()
