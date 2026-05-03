import type {ProjectOptions, ProjectType} from '../types'
import type {CliOptions} from './options-parser'

import process from 'node:process'

import {cancel, isCancel, log, select, text} from '@clack/prompts'

/**
 * Internal port for asking the user for missing values. The production
 * adapter wraps @clack/prompts; tests pass a scripted prompter that returns
 * predetermined answers and can assert on which prompts were (and weren't)
 * called.
 */
export type Prompter = {
  promptName(initial?: string): Promise<string>
  promptType(initial?: ProjectType): Promise<ProjectType>
}

const DEFAULT_PROJECT_TYPE: ProjectType = 'fullstack'

const PROJECT_TYPE_OPTIONS: {
  value: ProjectType
  label: string
  hint: string
}[] = [
  {value: 'fullstack', label: 'Fullstack', hint: 'React + Bun + Hono + SQLite'},
  {
    value: 'client-only',
    label: 'Client-only SPA',
    hint: 'React single page application',
  },
  {value: 'library', label: 'Library', hint: 'npm package for distribution'},
  {value: 'vanilla', label: 'Vanilla', hint: 'Basic HTML/CSS/JS setup'},
]

export function getProjectNameError(name: string | undefined): string | null {
  if (!name || name.length === 0) {
    return 'Project name is required'
  }
  if (/^[0-9]/.test(name)) {
    return 'Project name cannot start with a number'
  }
  if (/^-/.test(name)) {
    return 'Project name cannot start with a hyphen'
  }
  if (!/^[a-z_][a-z0-9_-]*$/.test(name)) {
    return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
  }
  return null
}

export function getProjectTypeError(type: string | undefined): string | null {
  if (!type) return 'Project type is required'
  const valid: ProjectType[] = [
    'fullstack',
    'client-only',
    'library',
    'vanilla',
  ]
  if (!(valid as string[]).includes(type)) {
    return `Invalid project type "${type}". Must be one of: ${valid.join(', ')}`
  }
  return null
}

export function createClackPrompter(): Prompter {
  return {
    promptName: async initial => {
      const result = await text({
        message: 'What is your project name?',
        placeholder: 'my-app',
        initialValue: initial,
        validate: value => {
          const err = getProjectNameError(value)
          if (err) return err
        },
      })
      if (isCancel(result)) {
        cancel('Operation cancelled')
        process.exit(1)
      }
      return result
    },

    promptType: async initial => {
      const result = await select({
        message: 'What type of project?',
        initialValue: initial ?? DEFAULT_PROJECT_TYPE,
        options: PROJECT_TYPE_OPTIONS,
      })
      if (isCancel(result)) {
        cancel('Operation cancelled')
        process.exit(1)
      }
      return result as ProjectType
    },
  }
}

/**
 * Turn parsed CLI args into the validated options the generator needs.
 *
 * If --yes was passed, validate-only mode: every value must be present and
 * valid; on any error, log and exit. (Project type defaults to 'fullstack'
 * when omitted under --yes.)
 *
 * Otherwise, prompt-for-truly-missing mode: values that are present and valid
 * pass through unprompted; values that are absent or invalid are prompted for
 * (with the invalid value pre-filled so the user can correct it).
 *
 * The prompter argument exists for tests; production callers omit it and get
 * the @clack/prompts adapter.
 */
export async function resolveProjectOptions(
  cliOptions: CliOptions,
  prompter: Prompter = createClackPrompter()
): Promise<ProjectOptions> {
  if (cliOptions.yes) {
    const errors: string[] = []

    const nameError = getProjectNameError(cliOptions.name)
    if (nameError) errors.push(nameError)

    const type = cliOptions.type ?? DEFAULT_PROJECT_TYPE
    const typeError = getProjectTypeError(type)
    if (typeError) errors.push(typeError)

    if (errors.length > 0) {
      for (const err of errors) {
        log.error(err)
      }
      process.exit(1)
    }

    return {name: cliOptions.name as string, type}
  }

  const nameValid =
    cliOptions.name !== undefined &&
    getProjectNameError(cliOptions.name) === null
  const name = nameValid
    ? (cliOptions.name as string)
    : await prompter.promptName(cliOptions.name)

  const typeValid =
    cliOptions.type !== undefined &&
    getProjectTypeError(cliOptions.type) === null
  const type = typeValid
    ? (cliOptions.type as ProjectType)
    : await prompter.promptType(cliOptions.type)

  return {name, type}
}
