import type {ProjectType} from '../utils/validation'

import process from 'node:process'

import {cancel, confirm, group, isCancel, select, text} from '@clack/prompts'

import {getProjectNameError} from '../utils/validation'

export type GuidedOptions = {
  name: string
  type: ProjectType
}

/**
 * Run the interactive guided mode to collect project options
 */
export async function runGuidedMode(
  defaults: Partial<GuidedOptions> = {}
): Promise<GuidedOptions> {
  const result = await group(
    {
      name: () =>
        text({
          message: 'What is your project name?',
          placeholder: 'my-app',
          initialValue: defaults.name,
          validate: value => {
            const error = getProjectNameError(value)
            if (error) return error
          },
        }),

      type: () =>
        select({
          message: 'What type of project?',
          initialValue: defaults.type ?? 'fullstack',
          options: [
            {
              value: 'fullstack',
              label: 'Fullstack',
              hint: 'React + Bun + Hono + SQLite',
            },
            {
              value: 'client-only',
              label: 'Client-only SPA',
              hint: 'React single page application',
            },
            {
              value: 'library',
              label: 'Library',
              hint: 'npm package for distribution',
            },
            {
              value: 'vanilla',
              label: 'Vanilla',
              hint: 'Basic HTML/CSS/JS setup',
            },
          ],
        }),
    },
    {
      onCancel: () => {
        cancel('Operation cancelled')
        process.exit(1)
      },
    }
  )

  return {
    name: result.name,
    type: result.type as ProjectType,
  }
}

/**
 * Prompt for confirmation
 */
export async function confirmAction(message: string): Promise<boolean> {
  const result = await confirm({
    message,
    initialValue: true,
  })

  if (isCancel(result)) {
    cancel('Operation cancelled')
    process.exit(1)
  }

  return result
}
