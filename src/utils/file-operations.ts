import {existsSync, mkdirSync} from 'node:fs'

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
}

/**
 * Check if a path exists
 */
export function pathExists(path: string): boolean {
  return existsSync(path)
}

export function getIsTemplateFile({
  fileContents,
  placeholderReplacements,
}: {
  fileContents: string
  placeholderReplacements: Record<string, string>
}): boolean {
  for (const placeholder of Object.keys(placeholderReplacements)) {
    if (fileContents.includes(placeholder)) {
      return true
    }
  }

  return false
}

/**
 * Replace placeholder substrings in `content`. Each key in `replacements` is
 * matched as a literal string (no `{{...}}` wrapping is added) and every
 * occurrence is replaced with its mapped value.
 */
export function replacePlaceholders(
  content: string,
  replacements: Record<string, string>
): string {
  let result = content
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value)
  }
  return result
}

/**
 * Get all files in a directory recursively (absolute paths, dotfiles included)
 */
export function getFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return []

  const glob = new Bun.Glob('**/*')
  return Array.from(glob.scanSync({cwd: dir, absolute: true, dot: true}))
}
