#!/usr/bin/env bun

// biome-ignore-all lint/suspicious/noConsole: it's ok here

import type {GuidedOptions} from './guided-mode'

import process from 'node:process'

import {intro, note, outro} from '@clack/prompts'
import colors from 'picocolors'

import {runCliMode} from './cli-mode'
import {generateProject} from './generator-core'
import {runGuidedMode} from './guided-mode'
import {getHelpText, getVersion, parseCliArgs} from './options-parser'

async function main() {
  const {options} = parseCliArgs(process.argv.slice(2))

  // Handle --help
  if (options.help) {
    console.log(getHelpText())
    process.exit(0)
  }

  // Handle --version
  if (options.version) {
    const version = await getVersion()
    console.log(version)
    process.exit(0)
  }

  intro('create-new-app')

  let projectOptions: GuidedOptions

  // If --yes flag or all required options provided, use CLI mode
  if (options.yes || (options.name && options.type)) {
    projectOptions = runCliMode(options)
  } else {
    // Otherwise, run interactive guided mode
    projectOptions = await runGuidedMode({
      name: options.name,
      type: options.type,
    })
  }

  await generateProject(projectOptions)

  const finalMessage = [
    colors.bold(colors.cyan(`cd ${projectOptions.name}`)),
    colors.bold(colors.cyan('bun dev')),
    '',
    colors.italic('Search the codebase for "TODO" to see what things'),
    colors.italic('you need to address before deploying to production.'),
    colors.italic('Happy coding!'),
  ].join('\n')

  // Wraps the entire message in a bordered box.
  note(finalMessage, 'Next steps:')

  outro(colors.cyan('https://github.com/qodesmith/create-new-app'))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
