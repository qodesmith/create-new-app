#!/usr/bin/env bun

// biome-ignore-all lint/suspicious/noConsole: it's ok here

import type {GuidedOptions} from './guided-mode'

import process from 'node:process'

import {intro, log, outro} from '@clack/prompts'

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

  log.info(`Creating ${projectOptions.type} project: ${projectOptions.name}`)

  await generateProject(projectOptions)

  outro(`Done! cd ${projectOptions.name} && bun dev`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
