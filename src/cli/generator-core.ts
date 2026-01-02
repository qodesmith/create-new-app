import { join, dirname } from 'node:path'
import type { GuidedOptions } from './guided-mode'
import type { ProjectType } from '../utils/validation'
import {
  copyDir,
  ensureDir,
  readAndReplace,
  writeFile,
  getFilesRecursive,
  pathExists,
} from '../utils/file-operations'
import { step, success, error, withSpinner } from '../utils/logger'

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
  }
}

/**
 * Generate a project from templates
 */
export async function generateProject(options: GuidedOptions): Promise<void> {
  const { name, type } = options
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
    PROJECT_NAME: name,
    YEAR: new Date().getFullYear().toString(),
  }

  // Copy and process template files
  await withSpinner('Copying project files...', async () => {
    const files = getFilesRecursive(templatePath)

    for (const srcFile of files) {
      const relativePath = srcFile.slice(templatePath.length + 1)
      const destPath = join(targetDir, relativePath)

      // Check if file needs placeholder replacement
      if (srcFile.endsWith('.ts') || srcFile.endsWith('.json') || srcFile.endsWith('.md')) {
        const content = await readAndReplace(srcFile, replacements)
        await writeFile(destPath, content)
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
