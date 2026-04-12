import {existsSync, mkdirSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'

/**
 * Recursively copy a directory from src to dest
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  ensureDir(dest)

  const entries = readdirSync(src, {withFileTypes: true})

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await Bun.write(destPath, Bun.file(srcPath))
    }
  }
}

/**
 * Copy a single file from src to dest
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  ensureDir(dirname(dest))
  await Bun.write(dest, Bun.file(src))
}

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

/**
 * Check if a directory is empty
 */
export function isDirEmpty(dir: string): boolean {
  if (!existsSync(dir)) return true
  return readdirSync(dir).length === 0
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
 * Replace {{VAR}} placeholders in a string
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
 * Get all files in a directory recursively
 */
export function getFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return []

  const glob = new Bun.Glob('**/*')
  return Array.from(glob.scanSync({cwd: dir, absolute: true, dot: true}))
}
