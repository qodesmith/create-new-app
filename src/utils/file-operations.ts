import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'

/**
 * Recursively copy a directory from src to dest
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  ensureDir(dest)

  const entries = readdirSync(src, { withFileTypes: true })

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
    mkdirSync(dir, { recursive: true })
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

/**
 * Read a file and replace placeholders with values
 * Placeholders use {{VAR}} syntax
 */
export async function readAndReplace(
  filePath: string,
  replacements: Record<string, string>
): Promise<string> {
  const content = await Bun.file(filePath).text()
  return replacePlaceholders(content, replacements)
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
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

/**
 * Write content to a file, creating parent directories if needed
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  ensureDir(dirname(filePath))
  await Bun.write(filePath, content)
}

/**
 * Get all files in a directory recursively
 */
export function getFilesRecursive(dir: string): string[] {
  const files: string[] = []

  if (!existsSync(dir)) return files

  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(fullPath))
    } else {
      files.push(fullPath)
    }
  }

  return files
}
