import type {ProjectType} from '../types'

import {parseArgs} from 'node:util'

export type CliOptions = {
  /** Project name (also used as directory name) */
  name?: string
  /** Type of project to generate */
  type?: ProjectType
  /** Show help */
  help: boolean
  /** Show version */
  version: boolean
  /** Skip prompts, use defaults */
  yes: boolean
}

export type ParseResult = {
  options: CliOptions
  positionals: string[]
}

const helpText = `
Usage: create-new-app [project-name] [options]

Options:
  -t, --type <type>    Project type: fullstack, client-only
  -y, --yes            Skip prompts, use defaults
  -h, --help           Show this help message
  -v, --version        Show version number

Examples:
  create-new-app my-app
  create-new-app my-app --type fullstack
  cna my-app -t fullstack -y
`

/**
 * Parse command line arguments
 */
export function parseCliArgs(args: string[]): ParseResult {
  const {values, positionals} = parseArgs({
    args,
    options: {
      type: {
        type: 'string',
        short: 't',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
      version: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
      yes: {
        type: 'boolean',
        short: 'y',
        default: false,
      },
    },
    allowPositionals: true,
  })

  return {
    options: {
      name: positionals[0],
      type: values.type as ProjectType | undefined,
      help: values.help ?? false,
      version: values.version ?? false,
      yes: values.yes ?? false,
    },
    positionals,
  }
}

/**
 * Get help text
 */
export function getHelpText(): string {
  return helpText.trim()
}

/**
 * Get version from package.json
 */
export async function getVersion(): Promise<string> {
  const pkg = await Bun.file(
    new URL('../../package.json', import.meta.url)
  ).json()
  return pkg.version
}
