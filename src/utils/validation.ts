import {existsSync} from 'node:fs'

/**
 * Validate project name
 * - Must be lowercase
 * - Can contain letters, numbers, hyphens, underscores
 * - Cannot start with a number or hyphen
 */
export function isValidProjectName(name: string): boolean {
  if (!name || name.length === 0) return false
  return /^[a-z_][a-z0-9_-]*$/.test(name)
}

/**
 * Get error message for invalid project name
 */
export function getProjectNameError(name: string): string | null {
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

/**
 * Check if target directory is safe to use
 * Returns error message if not safe, null if safe
 */
export function validateTargetDir(targetDir: string): string | null {
  if (existsSync(targetDir)) {
    return `Directory "${targetDir}" already exists`
  }
  return null
}

/**
 * Validate project type
 */
export type ProjectType = 'fullstack' | 'client-only' | 'library' | 'vanilla'

export function isValidProjectType(type: string): type is ProjectType {
  return ['fullstack', 'client-only', 'library', 'vanilla'].includes(type)
}

/**
 * Get error message for invalid project type
 */
export function getProjectTypeError(type: string): string | null {
  if (!isValidProjectType(type)) {
    return `Invalid project type "${type}". Must be one of: fullstack, client-only, library, vanilla`
  }
  return null
}
