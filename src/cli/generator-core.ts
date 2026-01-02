import type {ProjectType} from '../utils/validation'
import type {GuidedOptions} from './guided-mode'

import {dirname, join, parse} from 'node:path'
import process from 'node:process'

import {
  ensureDir,
  getFilesRecursive,
  pathExists,
  readAndReplace,
  writeFile,
} from '../utils/file-operations'
import {error, step, success, withSpinner} from '../utils/logger'

/**
 * Get the path to a project template
 */
function getTemplatePath(type: ProjectType): string {
  const templatesRoot = join(dirname(import.meta.dir), 'projects')

  switch (type) {
    case 'fullstack':
      return join(templatesRoot, 'fullstack')
    case 'client-only':
      return join(templatesRoot, 'client-only-react')
    case 'library':
      return join(templatesRoot, 'library')
    case 'vanilla':
      return join(templatesRoot, 'vanilla')
    default:
      // This should never happen.
      throw new Error(`Unknown project type: ${type}`)
  }
}

/**
 * Generate a project from templates
 */
export async function generateProject(options: GuidedOptions): Promise<void> {
  const {name, type} = options
  const targetDir = join(process.cwd(), name)
  const templatePath = getTemplatePath(type)

  // Check template exists
  if (!pathExists(templatePath)) {
    error(`Template for "${type}" not found at ${templatePath}`)
    process.exit(1)
  }

  // Create target directory
  step(`Creating project directory: ${name}`)
  ensureDir(targetDir)

  // Replacements for templates
  const replacements: Record<string, string> = {
    // biome-ignore-start lint/style/useNamingConvention: these are the template keys
    PROJECT_NAME: name,
    // Add other placeholders here...
    // biome-ignore-end lint/style/useNamingConvention: these are the template keys
  }

  // Copy and process template files
  await withSpinner('Copying project files...', async () => {
    const files = getFilesRecursive(templatePath)
    const templateFiles = new Set([
      'fly.toml',
      'litefs.yml',
      'package.json',
      'index.html',
      '__root.tsx',
      'index.ts',
    ])

    for (const srcFile of files) {
      const relativePath = srcFile.slice(templatePath.length + 1)
      const destPath = join(targetDir, relativePath)
      const {base: fileName} = parse(srcFile)

      // Check if file needs placeholder replacement
      if (templateFiles.has(fileName)) {
        const content = await readAndReplace(srcFile, replacements)
        await writeFile(destPath, content)
      } else if (fileName === 'biome.jsonc') {
        // Remove "root": false line (used to prevent conflicts during development)
        const content = await Bun.file(srcFile).text()
        const cleaned = content.replace(/^\s*"root":\s*false,?\n?/m, '')
        ensureDir(dirname(destPath))
        await Bun.write(destPath, cleaned)
      } else {
        // Binary files - copy as-is
        ensureDir(dirname(destPath))
        await Bun.write(destPath, Bun.file(srcFile))
      }
    }
  })

  // Install dependencies
  await withSpinner('Installing dependencies...', async () => {
    const proc = Bun.spawn(['bun', 'install'], {
      cwd: targetDir,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    await proc.exited
  })

  success('Project created successfully!')
}
