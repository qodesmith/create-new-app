import type {GuidedOptions} from './guided-mode'
import type {CliOptions} from './options-parser'

import process from 'node:process'

import {error} from '../utils/logger'
import {getProjectNameError, getProjectTypeError} from '../utils/validation'

export type CliModeResult =
  | {success: true; options: GuidedOptions}
  | {success: false; errors: string[]}

/**
 * Validate and convert CLI options to generation options
 * Used when --yes flag is passed or all options are provided
 */
export function validateCliOptions(options: CliOptions): CliModeResult {
  const errors: string[] = []

  // Validate name
  if (options.name) {
    const nameError = getProjectNameError(options.name)
    if (nameError) {
      errors.push(nameError)
    }
  } else {
    errors.push('Project name is required. Usage: create-new-app <name>')
  }

  // Validate type (default to fullstack if not provided)
  const type = options.type ?? 'fullstack'
  const typeError = getProjectTypeError(type)
  if (typeError) {
    errors.push(typeError)
  }

  if (errors.length > 0) {
    return {success: false, errors}
  }

  return {
    success: true,
    options: {
      name: options.name as string, // options.name is a string here
      type,
    },
  }
}

/**
 * Run CLI mode - validate options and exit if invalid
 */
export function runCliMode(options: CliOptions): GuidedOptions {
  const result = validateCliOptions(options)

  if (!result.success) {
    for (const err of result.errors) {
      error(err)
    }
    process.exit(1)
  }

  return result.options
}
