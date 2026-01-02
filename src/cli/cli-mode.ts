import type { CliOptions } from './options-parser'
import type { GuidedOptions } from './guided-mode'
import {
  isValidProjectName,
  getProjectNameError,
  isValidProjectType,
  getProjectTypeError,
} from '../utils/validation'
import { error, cancel } from '../utils/logger'

export interface CliModeResult {
  success: boolean
  options?: GuidedOptions
  errors?: string[]
}

/**
 * Validate and convert CLI options to generation options
 * Used when --yes flag is passed or all options are provided
 */
export function validateCliOptions(options: CliOptions): CliModeResult {
  const errors: string[] = []

  // Validate name
  if (!options.name) {
    errors.push('Project name is required. Usage: create-new-app <name>')
  } else {
    const nameError = getProjectNameError(options.name)
    if (nameError) {
      errors.push(nameError)
    }
  }

  // Validate type (default to fullstack if not provided)
  const type = options.type ?? 'fullstack'
  const typeError = getProjectTypeError(type)
  if (typeError) {
    errors.push(typeError)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    options: {
      name: options.name!,
      type: type,
    },
  }
}

/**
 * Run CLI mode - validate options and exit if invalid
 */
export function runCliMode(options: CliOptions): GuidedOptions {
  const result = validateCliOptions(options)

  if (!result.success) {
    for (const err of result.errors!) {
      error(err)
    }
    process.exit(1)
  }

  return result.options!
}
