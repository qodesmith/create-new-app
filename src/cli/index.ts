#!/usr/bin/env bun

// biome-ignore-all lint/suspicious/noConsole: it's ok here

import process from 'node:process'

import {intro, note, outro} from '@clack/prompts'
import colors from 'picocolors'

import {ShellCommandError} from '../utils/run'
import {generateProject} from './generateProject'
import {getHelpText, getVersion, parseCliArgs} from './options-parser'
import {resolveProjectOptions} from './resolveProjectOptions'

async function main() {
  const {options} = parseCliArgs(process.argv.slice(2))

  if (options.help) {
    console.log(getHelpText())
    process.exit(0)
  }

  if (options.version) {
    const version = await getVersion()
    console.log(version)
    process.exit(0)
  }

  intro('create-new-app')

  const projectOptions = await resolveProjectOptions(options)

  await generateProject(projectOptions)

  const finalMessage = [
    colors.bold(colors.cyan(`cd ${projectOptions.name}`)),
    colors.bold(colors.cyan('bun dev')),
    '',
    colors.italic('Search the codebase for "TODO" to see what things'),
    colors.italic('you need to address before deploying to production.'),
    colors.italic('Happy coding!'),
  ].join('\n')

  note(finalMessage, 'Next steps:')

  outro(colors.cyan('https://github.com/qodesmith/create-new-app'))
}

main().catch(err => {
  if (err instanceof ShellCommandError) {
    console.error(err.stderr || err.message)
    process.exit(err.exitCode)
  }
  console.error(err)
  process.exit(1)
})
