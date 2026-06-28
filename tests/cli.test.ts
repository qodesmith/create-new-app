import {describe, expect, it} from 'bun:test'

import {getHelpText, parseCliArgs} from '../src/cli/options-parser'
import {
  getProjectNameError,
  getProjectTypeError,
} from '../src/cli/resolveProjectOptions'

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
    const result = parseCliArgs(['my-app', '-t', 'client-only'])
    expect(result.options.type).toBe('client-only')
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

describe('getProjectNameError', () => {
  it('returns null for valid names', () => {
    expect(getProjectNameError('my-app')).toBeNull()
    expect(getProjectNameError('my_app')).toBeNull()
    expect(getProjectNameError('myapp123')).toBeNull()
    expect(getProjectNameError('_private')).toBeNull()
  })

  it('returns the "required" message for empty or undefined', () => {
    expect(getProjectNameError('')).toBe('Project name is required')
    expect(getProjectNameError(undefined)).toBe('Project name is required')
  })

  it('returns the "starts with a number" message', () => {
    expect(getProjectNameError('123app')).toBe(
      'Project name cannot start with a number'
    )
  })

  it('returns the "starts with a hyphen" message', () => {
    expect(getProjectNameError('-myapp')).toBe(
      'Project name cannot start with a hyphen'
    )
  })

  it('returns the "lowercase only" message for uppercase input', () => {
    expect(getProjectNameError('MyApp')).toBe(
      'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
    )
  })
})

describe('getProjectTypeError', () => {
  it('returns null for valid types', () => {
    expect(getProjectTypeError('fullstack')).toBeNull()
    expect(getProjectTypeError('client-only')).toBeNull()
  })

  it('returns the "required" message when missing', () => {
    expect(getProjectTypeError(undefined)).toBe('Project type is required')
  })

  it('returns the "must be one of" message for invalid input', () => {
    expect(getProjectTypeError('invalid')).toBe(
      'Invalid project type "invalid". Must be one of: fullstack, client-only'
    )
    expect(getProjectTypeError('')).toBe('Project type is required')
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
