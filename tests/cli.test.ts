import type {ProjectType} from '../src/utils/validation'

import {describe, expect, it} from 'bun:test'

import {validateCliOptions} from '../src/cli/cli-mode'
import {getHelpText, parseCliArgs} from '../src/cli/options-parser'
import {isValidProjectName, isValidProjectType} from '../src/utils/validation'

describe('parseCliArgs', () => {
  it('parses project name as positional', () => {
    const result = parseCliArgs(['my-app'])
    expect(result.options.name).toBe('my-app')
  })

  it('parses --type flag', () => {
    const result = parseCliArgs(['my-app', '--type', 'fullstack'])
    expect(result.options.type).toBe('fullstack')
  })

  it('parses -t shorthand', () => {
    const result = parseCliArgs(['my-app', '-t', 'library'])
    expect(result.options.type).toBe('library')
  })

  it('parses --yes flag', () => {
    const result = parseCliArgs(['my-app', '--yes'])
    expect(result.options.yes).toBe(true)
  })

  it('parses -y shorthand', () => {
    const result = parseCliArgs(['my-app', '-y'])
    expect(result.options.yes).toBe(true)
  })

  it('parses --help flag', () => {
    const result = parseCliArgs(['--help'])
    expect(result.options.help).toBe(true)
  })

  it('parses --version flag', () => {
    const result = parseCliArgs(['--version'])
    expect(result.options.version).toBe(true)
  })
})

describe('validateCliOptions', () => {
  it('validates valid options', () => {
    const result = validateCliOptions({
      name: 'my-app',
      type: 'fullstack',
      help: false,
      version: false,
      yes: true,
    })
    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.options.name).toBe('my-app')
    }
  })

  it('fails without name', () => {
    const result = validateCliOptions({
      type: 'fullstack',
      help: false,
      version: false,
      yes: true,
    })
    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors).toContain(
        'Project name is required. Usage: create-new-app <name>'
      )
    }
  })

  it('fails with invalid project type', () => {
    const result = validateCliOptions({
      name: 'my-app',
      type: 'invalid' as ProjectType, // This is NOT a ProjectType - just to satisfy linting.
      help: false,
      version: false,
      yes: true,
    })
    expect(result.success).toBe(false)
  })
})

describe('isValidProjectName', () => {
  it('accepts valid names', () => {
    expect(isValidProjectName('my-app')).toBe(true)
    expect(isValidProjectName('my_app')).toBe(true)
    expect(isValidProjectName('myapp123')).toBe(true)
    expect(isValidProjectName('_private')).toBe(true)
  })

  it('rejects names starting with number', () => {
    expect(isValidProjectName('123app')).toBe(false)
  })

  it('rejects names starting with hyphen', () => {
    expect(isValidProjectName('-myapp')).toBe(false)
  })

  it('rejects uppercase', () => {
    expect(isValidProjectName('MyApp')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidProjectName('')).toBe(false)
  })
})

describe('isValidProjectType', () => {
  it('accepts valid types', () => {
    expect(isValidProjectType('fullstack')).toBe(true)
    expect(isValidProjectType('client-only')).toBe(true)
    expect(isValidProjectType('library')).toBe(true)
    expect(isValidProjectType('vanilla')).toBe(true)
  })

  it('rejects invalid types', () => {
    expect(isValidProjectType('invalid')).toBe(false)
    expect(isValidProjectType('')).toBe(false)
  })
})

describe('getHelpText', () => {
  it('returns help text', () => {
    const help = getHelpText()
    expect(help).toContain('Usage:')
    expect(help).toContain('create-new-app')
    expect(help).toContain('--type')
    expect(help).toContain('--help')
  })
})
