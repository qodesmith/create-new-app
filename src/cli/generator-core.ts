import type {ProjectType} from '../utils/validation'
import type {GuidedOptions} from './guided-mode'

import {$} from 'bun'
import {dirname, join, parse} from 'node:path'
import process from 'node:process'

import {log} from '@clack/prompts'

import {
  ensureDir,
  getFilesRecursive,
  pathExists,
  readAndReplace,
  writeFile,
} from '../utils/file-operations'
import {withSpinner} from '../utils/withSpinner'

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
    log.error(`Template for "${type}" not found at ${templatePath}`)
    process.exit(1)
  }

  // Create target directory
  log.step(`Creating project directory: ${name}`)
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
      '.env.development',
      '__root.tsx',
      'Dockerfile',
      'Dockerfile.local',
      'drizzleStudio.ts',
      'fly.toml',
      'index.html',
      'litefs.yml',
      'options.ts',
      'package.json',
    ])

    for (const srcFile of files) {
      const relativePath = srcFile.slice(templatePath.length + 1)
      const destPath = join(targetDir, relativePath)
      const {base: fileName} = parse(srcFile)

      ensureDir(dirname(destPath))

      // Check if file needs placeholder replacement
      if (templateFiles.has(fileName)) {
        const content = await readAndReplace(srcFile, replacements)
        await writeFile(destPath, content)
      } else if (fileName === 'biome.jsonc') {
        // Remove "root": false line (used to prevent conflicts during development)
        const content = await Bun.file(srcFile).text()
        const cleaned = content.replace(/^\s*"root":\s*false,?\n?/m, '')
        await Bun.write(destPath, cleaned)
      } else if (fileName.endsWith('-keep')) {
        const sanitizedPath = destPath.slice(0, -5) // Remove "-keep" from path
        await Bun.write(sanitizedPath, Bun.file(srcFile))
      } else {
        // Copy as-is
        await Bun.write(destPath, Bun.file(srcFile))
      }
    }
  })

  // Install dependencies
  await withSpinner('Installing dependencies...', async () => {
    await $`bun install`.cwd(targetDir).quiet()
  })

  // Set up Biome
  await withSpinner('Setting up Biome...', async () => {
    await $`bunx biomeInit --jsonc`.cwd(targetDir).quiet()
  })

  log.success('Project created successfully!')
}
